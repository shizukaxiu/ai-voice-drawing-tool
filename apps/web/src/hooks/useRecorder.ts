import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioSegment {
  blob: Blob
  durationMs: number
}

export interface UseRecorderOptions {
  /** 检测到一段有效语音后的回调 */
  onSegment: (segment: AudioSegment) => void
  /** 说话状态变化 */
  onSpeakingChange?: (isSpeaking: boolean) => void
  /** 静音时长变化（毫秒） */
  onSilenceDurationChange?: (ms: number) => void
}

export interface UseRecorderReturn {
  /** 是否正在监听麦克风 */
  isRecording: boolean
  /** 当前是否检测到用户说话 */
  isSpeaking: boolean
  /** 当前已持续静音时长（毫秒） */
  silenceDuration: number
  /** 启动持续监听 */
  startRecording: () => Promise<void>
  /** 停止监听 */
  stopRecording: () => void
  /** 错误信息 */
  error: string | null
}

interface VADConfig {
  /** 音量阈值，超过认为在说话 */
  threshold: number
  /** 静音超时（毫秒），达到后自动提交 */
  silenceTimeout: number
  /** 最短有效语音（毫秒），低于则忽略 */
  minSpeechDuration: number
}

const VAD: VADConfig = {
  threshold: 0.05,
  silenceTimeout: 3000,
  // 允许较短的命令词（如“停”），同时过滤明显是噪音的极短触发
  minSpeechDuration: 200,
}

export function useRecorder(options: UseRecorderOptions): UseRecorderReturn {
  const { onSegment, onSpeakingChange, onSilenceDurationChange } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [silenceDuration, setSilenceDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const vadFrameRef = useRef<number | null>(null)

  const segmentStartTimeRef = useRef<number>(0)
  const speechStartTimeRef = useRef<number | null>(null)
  const silenceStartTimeRef = useRef<number | null>(null)
  const hasSpeechRef = useRef(false)

  const notifySpeaking = useCallback(
    (value: boolean) => {
      setIsSpeaking(value)
      onSpeakingChange?.(value)
    },
    [onSpeakingChange]
  )

  const notifySilence = useCallback(
    (ms: number) => {
      setSilenceDuration(ms)
      onSilenceDurationChange?.(ms)
    },
    [onSilenceDurationChange]
  )

  const cleanup = useCallback(() => {
    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current)
      vadFrameRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        // ignore
      }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        void audioContextRef.current.close()
      } catch {
        // ignore
      }
    }

    mediaRecorderRef.current = null
    audioChunksRef.current = []
    streamRef.current = null
    audioContextRef.current = null
    analyserRef.current = null
    sourceRef.current = null

    setIsRecording(false)
    setIsSpeaking(false)
    setSilenceDuration(0)
    // 注意：这里不调用外部 onSpeakingChange/onSilenceDurationChange，
    // 避免在 effect cleanup 中触发父组件 setState 导致无限循环。
  }, [])

  const emitSegment = useCallback(() => {
    const chunks = audioChunksRef.current
    if (chunks.length === 0) return

    const blob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' })
    audioChunksRef.current = []

    const duration = performance.now() - segmentStartTimeRef.current
    segmentStartTimeRef.current = performance.now()

    if (blob.size > 0) {
      onSegment({ blob, durationMs: duration })
    }
  }, [onSegment])

  const runVAD = useCallback(() => {
    const analyser = analyserRef.current
    const recorder = mediaRecorderRef.current
    if (!analyser || !recorder) return

    const dataArray = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(dataArray)

    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128.0
      sum += v * v
    }
    const rms = Math.sqrt(sum / dataArray.length)
    const now = performance.now()

    if (rms > VAD.threshold) {
      // 检测到说话
      if (!hasSpeechRef.current) {
        hasSpeechRef.current = true
        speechStartTimeRef.current = now
      }
      silenceStartTimeRef.current = null
      notifySpeaking(true)
      notifySilence(0)
    } else {
      // 静音
      notifySpeaking(false)

      if (hasSpeechRef.current) {
        if (silenceStartTimeRef.current === null) {
          silenceStartTimeRef.current = now
        }
        const silence = now - silenceStartTimeRef.current
        notifySilence(silence)

        if (silence >= VAD.silenceTimeout) {
          const speechDuration = speechStartTimeRef.current
            ? now - speechStartTimeRef.current
            : 0

          // 重置状态（在 emit 前，避免递归）
          hasSpeechRef.current = false
          speechStartTimeRef.current = null
          silenceStartTimeRef.current = null
          notifySilence(0)

          if (speechDuration >= VAD.minSpeechDuration) {
            emitSegment()
          }
        }
      }
    }

    vadFrameRef.current = requestAnimationFrame(runVAD)
  }, [emitSegment, notifySpeaking, notifySilence])

  const startRecording = useCallback(async () => {
    setError(null)

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      // 已经在监听中
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = () => {
        setError('录音失败，请检查麦克风权限')
        cleanup()
      }

      // 使用 timeslice 定期收集音频块，支持连续多轮语音输入
      mediaRecorder.start(100)
      segmentStartTimeRef.current = performance.now()
      setIsRecording(true)
      notifySpeaking(false)
      notifySilence(0)

      vadFrameRef.current = requestAnimationFrame(runVAD)
    } catch (err) {
      console.error('Failed to start recording:', err)
      const message =
        err instanceof Error ? err.message : '无法访问麦克风，请检查权限设置'
      setError(message)
      cleanup()
      throw err
    }
  }, [cleanup, runVAD, notifySpeaking, notifySilence])

  const stopRecording = useCallback(() => {
    cleanup()
  }, [cleanup])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isRecording,
    isSpeaking,
    silenceDuration,
    startRecording,
    stopRecording,
    error,
  }
}
