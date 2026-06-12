import { useState } from 'react'
import { useRecorder } from './hooks/useRecorder'
import { useChatStore } from './store/useChatStore'
import { uploadAudio, sendText } from './services/api'
import { RecorderButton } from './components/RecorderButton'
import { ChatMessageList } from './components/ChatMessageList'
import { StatusBar } from './components/StatusBar'
import { ImageActions } from './components/ImageActions'
import { ConfigPanel } from './components/ConfigPanel'
import type {
  GenerateRequest,
  GenerateResponse,
  SessionContext,
} from '@voice-draw/shared'

function App() {
  const store = useChatStore()
  const recorder = useRecorder()
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const [debugText, setDebugText] = useState('')

  const buildContext = (): SessionContext | null => {
    if (store.messages.length === 0) return null
    return {
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
  }

  const handleResult = (result: GenerateResponse) => {
    const userTranscript =
      result.updated_context?.conversation_history
        ?.slice()
        .reverse()
        .find(
          (m: { type: string; role: string; content: string }) =>
            m.type === 'voice' && m.role === 'user'
        )?.content || ''
    if (lastMessageId) {
      store.updateUserMessage(lastMessageId, userTranscript)
    }

    if (result.status === 'need_clarification') {
      store.setClarifying(
        result.response || '',
        result.suggestions || [],
        (result.extracted as any) || null
      )
    } else if (result.status === 'complete') {
      store.setImageReady(
        result.response || '',
        result.image_url || null,
        (result.extracted as any) || null
      )
    } else {
      store.setError(result.response || '处理失败，请重试')
    }
  }

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

    const request: GenerateRequest = {
      session_id: store.sessionId,
      context: buildContext(),
      edit_mode: store.nextEditMode,
    }

    try {
      const result = await uploadAudio(audioBlob, request)
      console.log('后端响应:', result)
      handleResult(result)
    } catch (error) {
      console.error('请求失败:', error)
      store.setError(
        error instanceof Error ? error.message : '请求失败，请重试'
      )
    } finally {
      store.setNextEditMode('image_edit')
    }
  }

  const submitText = async (text: string) => {
    const id = store.addUserTextMessage(text)
    setLastMessageId(id)
    store.setProcessing()

    const request: GenerateRequest = {
      session_id: store.sessionId,
      context: buildContext(),
      edit_mode: store.nextEditMode,
    }

    try {
      const result = await sendText(text, request)
      console.log('后端响应:', result)
      handleResult(result)
    } catch (error) {
      console.error('请求失败:', error)
      store.setError(
        error instanceof Error ? error.message : '请求失败，请重试'
      )
    } finally {
      store.setNextEditMode('image_edit')
    }
  }

  const handleDebugSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debugText.trim()) return
    setDebugText('')
    await submitText(debugText)
  }

  const handleSuggestionClick = (text: string) => {
    if (store.appState === 'processing') return
    submitText(text)
  }

  const isBusy = store.appState === 'processing'

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 max-w-[1600px] mx-auto">
        {/* 左侧配置面板 */}
        <div className="lg:col-span-4 h-full min-h-0">
          <ConfigPanel />
        </div>

        {/* 右侧聊天区域 */}
        <div className="lg:col-span-8 h-full min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <header className="bg-white border-b border-gray-100 py-3 px-4 z-10">
            <h1 className="text-lg font-bold text-center text-gray-900">
              AI 语音绘图工具
            </h1>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-3xl mx-auto">
              <ChatMessageList
                messages={store.messages}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full">
            <StatusBar appState={store.appState} />
          </div>

          {store.appState === 'image_ready' && (
            <div className="max-w-3xl mx-auto w-full">
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
            </div>
          )}

          {import.meta.env.DEV && (
            <form
              onSubmit={handleDebugSubmit}
              className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 flex gap-2"
            >
              <input
                type="text"
                value={debugText}
                onChange={(e) => setDebugText(e.target.value)}
                placeholder="调试：输入文字测试"
                disabled={isBusy}
                className="flex-1 px-3 py-1.5 text-sm border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="submit"
                disabled={isBusy}
                className="px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-200 rounded-md hover:bg-yellow-300 disabled:opacity-50"
              >
                发送
              </button>
            </form>
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
      </div>
    </div>
  )
}

export default App
