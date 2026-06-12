import type { DisplayMessage } from '../store/useChatStore'
import { SuggestionChips } from './SuggestionChips'

interface ChatMessageItemProps {
  message: DisplayMessage
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === 'user'

  if (message.type === 'image') {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[80%] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
          <img
            src={message.content}
            alt="生成的图片"
            className="w-full max-w-md object-cover"
            loading="lazy"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
        }`}
      >
        {message.type === 'voice' && message.audioUrl && (
          <audio
            controls
            src={message.audioUrl}
            className="max-w-full mb-2"
            preload="metadata"
          />
        )}
        {message.content && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        )}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3">
            <SuggestionChips suggestions={message.suggestions} />
          </div>
        )}
      </div>
    </div>
  )
}
