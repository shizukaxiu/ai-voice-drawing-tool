import type { UseRecorderReturn } from '../hooks/useRecorder'

interface RecorderButtonProps {
  recorder: UseRecorderReturn
  disabled?: boolean
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
  onRecord?: (audioBlob: Blob) => void
}

export function RecorderButton({
  recorder,
  disabled,
  onRecordingStart,
  onRecordingEnd,
  onRecord,
}: RecorderButtonProps) {
  const { isRecording, startRecording, stopRecording, error } = recorder

  const handleStart = async () => {
    if (disabled) return
    onRecordingStart?.()
    await startRecording()
  }

  const handleStop = () => {
    onRecordingEnd?.()
    const audioBlob = stopRecording()
    if (audioBlob) {
      onRecord?.(audioBlob)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onMouseDown={handleStart}
        onMouseUp={handleStop}
        onMouseLeave={isRecording ? handleStop : undefined}
        onTouchStart={(e) => {
          e.preventDefault()
          handleStart()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleStop()
        }}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${
            disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : isRecording
                ? 'bg-red-500 scale-110 shadow-lg shadow-red-200'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200'
          }
        `}
        aria-label={isRecording ? '录音中，松开结束' : '按住说话'}
      >
        <div
          className={`
            rounded-full transition-all duration-200 bg-white
            ${isRecording ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-full'}
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
