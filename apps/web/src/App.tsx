import { useState } from 'react'
import { useRecorder } from './hooks/useRecorder'
import { useChatStore } from './store/useChatStore'
import { uploadAudio } from './services/api'
import { RecorderButton } from './components/RecorderButton'
import { ChatMessageList } from './components/ChatMessageList'
import { StatusBar } from './components/StatusBar'
import { ImageActions } from './components/ImageActions'
import type { GenerateRequest, SessionContext } from '@voice-draw/shared'

function App() {
  const store = useChatStore()
  const recorder = useRecorder()
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  const handleRecordingStart = () => {
    store.startRecording()
  }

  const handleRecordingEnd = () => {
    store.stopRecording()
  }

  const handleRecord = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) return

    const { id } = store.addUserVoiceMessage(audioBlob)
    setLastMessageId(id)
    store.setProcessing()

    const context: SessionContext | null =
      store.messages.length > 0
        ? {
            session_id: store.sessionId,
            current_params: store.currentParams,
            current_prompt: null,
            negative_prompt: null,
            current_image_url: store.currentImageUrl,
            conversation_history: store.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              type: msg.type,
              created_at: msg.created_at,
            })),
            pending_clarification: store.pendingClarification,
            mode: store.currentImageUrl ? 'modifying' : 'creating',
          }
        : null

    const request: GenerateRequest = {
      session_id: store.sessionId,
      context,
      edit_mode: store.nextEditMode,
    }

    try {
      const result = await uploadAudio(audioBlob, request)
      console.log('后端响应:', result)

      const userTranscript =
        result.updated_context?.conversation_history
          .slice()
          .reverse()
          .find((m) => m.type === 'voice' && m.role === 'user')?.content || ''
      if (lastMessageId) {
        store.updateUserMessage(lastMessageId, userTranscript)
      }

      if (result.status === 'need_clarification') {
        store.setClarifying(result.response, result.suggestions)
      } else if (result.status === 'complete') {
        store.setImageReady(
          result.response,
          result.image_url,
          result.extracted
        )
      } else {
        store.setError(result.response || '处理失败，请重试')
      }
    } catch (error) {
      console.error('请求失败:', error)
      store.setError(
        error instanceof Error ? error.message : '请求失败，请重试'
      )
    } finally {
      store.setNextEditMode('image_edit')
    }
  }

  const isBusy = store.appState === 'processing'

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm py-3 px-4 z-10">
        <h1 className="text-lg font-bold text-center text-gray-900">
          AI 语音绘图工具
        </h1>
      </header>

      <ChatMessageList messages={store.messages} />

      <StatusBar appState={store.appState} />

      {store.appState === 'image_ready' && (
        <ImageActions
          onRegenerate={() => {
            store.setNextEditMode('regenerate')
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: 'smooth',
            })
          }}
          onNewChat={() => store.resetChat()}
        />
      )}

      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <RecorderButton
            recorder={recorder}
            disabled={isBusy}
            onRecordingStart={handleRecordingStart}
            onRecordingEnd={handleRecordingEnd}
            onRecord={handleRecord}
          />
        </div>
      </div>
    </div>
  )
}

export default App
