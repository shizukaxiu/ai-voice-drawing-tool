interface RecorderButtonProps {
  isListening: boolean
  isSpeaking: boolean
  isBusy: boolean
  silenceDuration: number
  error?: string | null
  onToggle: () => void
}

export function RecorderButton({
  isListening,
  isSpeaking,
  isBusy,
  silenceDuration,
  error,
  onToggle,
}: RecorderButtonProps) {
  const getButtonText = () => {
    if (isBusy) return 'AI 处理中…'
    if (isListening) {
      if (isSpeaking) return '正在说话'
      const remaining = Math.max(0, 3000 - silenceDuration)
      if (remaining < 800) return '即将发送…'
      return '聆听中，点击停止'
    }
    return '点击开始语音'
  }

  const getAriaLabel = () => {
    if (isBusy) return 'AI 正在处理'
    if (isListening) return '聆听中，点击停止'
    return '点击开始语音对话'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={isBusy}
        onClick={onToggle}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${
            isBusy
              ? 'bg-gray-300 cursor-not-allowed'
              : isListening
                ? isSpeaking
                  ? 'bg-red-600 scale-110 shadow-lg shadow-red-300 animate-pulse'
                  : 'bg-red-500 scale-110 shadow-lg shadow-red-200'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200'
          }
        `}
        aria-label={getAriaLabel()}
      >
        <div
          className={`
            transition-all duration-200 bg-white
            ${isListening ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-full'}
          `}
        />
      </button>
      <span className="text-sm text-gray-600">{getButtonText()}</span>
      {error && (
        <span className="text-sm text-red-500 max-w-xs text-center">
          {error}
        </span>
      )}
    </div>
  )
}
