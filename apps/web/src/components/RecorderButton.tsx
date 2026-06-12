import type { UseRecorderReturn } from '../hooks/useRecorder'

interface RecorderButtonProps {
  recorder: UseRecorderReturn
  onRecordingComplete: (audioBlob: Blob) => void
}

export function RecorderButton({ recorder, onRecordingComplete }: RecorderButtonProps) {
  const { isRecording, startRecording, stopRecording, error } = recorder

  const handleMouseDown = async () => {
    await startRecording()
  }

  const handleMouseUp = () => {
    const audioBlob = stopRecording()
    if (audioBlob) {
      onRecordingComplete(audioBlob)
    }
  }

  const handleTouchStart = async (e: React.TouchEvent) => {
    e.preventDefault()
    await startRecording()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    const audioBlob = stopRecording()
    if (audioBlob) {
      onRecordingComplete(audioBlob)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={isRecording ? handleMouseUp : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${
            isRecording
              ? 'bg-red-500 scale-110 shadow-lg shadow-red-200'
              : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200'
          }
        `}
        aria-label={isRecording ? '录音中，松开结束' : '按住说话'}
      >
        <div
          className={`
            rounded-full transition-all duration-200
            ${isRecording ? 'w-6 h-6 bg-white' : 'w-8 h-8 bg-white rounded-full'}
          `}
        />
      </button>
      <span className="text-sm text-gray-600">
        {isRecording ? '松开结束' : '按住说话'}
      </span>
      {error && (
        <span className="text-sm text-red-500 max-w-xs text-center">
          {error}
        </span>
      )}
    </div>
  )
}
