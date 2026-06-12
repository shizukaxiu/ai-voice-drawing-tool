import { useState } from 'react'
import type { DisplayMessage } from '../store/useChatStore'
import { SuggestionChips } from './SuggestionChips'
import { ImageLightbox } from './ImageLightbox'

interface ChatMessageItemProps {
  message: DisplayMessage
  onSuggestionClick?: (text: string) => void
}

export function ChatMessageItem({ message, onSuggestionClick }: ChatMessageItemProps) {
  const isUser = message.role === 'user'
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (message.type === 'image') {
    return (
      <div className="flex justify-start mb-4">
        <div
          className="relative max-w-[80%] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 cursor-zoom-in group"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={message.content}
            alt="生成的图片"
            className="w-full max-w-md object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full transition-opacity">
              点击放大
            </span>
          </div>
        </div>
        {lightboxOpen && (
          <ImageLightbox
            src={message.content}
            onClose={() => setLightboxOpen(false)}
          />
        )}
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
            <SuggestionChips suggestions={message.suggestions} onSuggestionClick={onSuggestionClick} />
          </div>
        )}
      </div>
    </div>
  )
}
