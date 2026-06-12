import { useState, useRef, useCallback } from 'react'

export interface UseRecorderReturn {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Blob | null
  error: string | null
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // 停止所有轨道，释放麦克风
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.onerror = () => {
        setError('录音失败，请检查麦克风权限')
        setIsRecording(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('无法访问麦克风，请检查权限设置')
    }
  }, [])

  const stopRecording = useCallback((): Blob | null => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      return null
    }

    mediaRecorder.stop()
    setIsRecording(false)

    if (audioChunksRef.current.length === 0) {
      return null
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    audioChunksRef.current = []
    return audioBlob
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  }
}
