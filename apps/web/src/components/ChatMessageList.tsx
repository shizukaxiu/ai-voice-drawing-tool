import { useRef, useEffect } from 'react'
import type { DisplayMessage } from '../store/useChatStore'
import { ChatMessageItem } from './ChatMessageItem'

interface ChatMessageListProps {
  messages: DisplayMessage[]
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <p className="text-sm">开始一段新的语音创作吧</p>
        </div>
      )}
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
