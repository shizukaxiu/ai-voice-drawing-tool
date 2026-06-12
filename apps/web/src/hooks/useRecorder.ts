import { useState, useRef, useCallback } from 'react'

export interface UseRecorderReturn {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  error: string | null
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    audioChunksRef.current = []
    stopResolverRef.current = null

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const chunks = audioChunksRef.current
        const blob =
          chunks.length > 0
            ? new Blob(chunks, { type: chunks[0].type || 'audio/webm' })
            : null
        audioChunksRef.current = []
        setIsRecording(false)
        if (stopResolverRef.current) {
          stopResolverRef.current(blob)
          stopResolverRef.current = null
        }
      }

      mediaRecorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop())
        setError('录音失败，请检查麦克风权限')
        setIsRecording(false)
        if (stopResolverRef.current) {
          stopResolverRef.current(null)
          stopResolverRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('无法访问麦克风，请检查权限设置')
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      setIsRecording(false)
      return Promise.resolve(null)
    }

    return new Promise((resolve) => {
      stopResolverRef.current = resolve
      mediaRecorder.stop()
    })
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  }
}
