interface ImageActionsProps {
  onRegenerate: () => void
  onNewChat: () => void
}

export function ImageActions({ onRegenerate, onNewChat }: ImageActionsProps) {
  return (
    <div className="flex justify-center gap-3 px-4 py-3 bg-white border-t border-gray-200">
      <button
        type="button"
        onClick={onRegenerate}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      >
        整张重画
      </button>
      <button
        type="button"
        onClick={onNewChat}
        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
      >
        开启新对话
      </button>
    </div>
  )
}
