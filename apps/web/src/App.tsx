import { useCallback, useRef } from 'react'
import { useRecorder } from './hooks/useRecorder'
import { useChatStore } from './store/useChatStore'
import { transcribeAudio, sendText } from './services/api'
import { RecorderButton } from './components/RecorderButton'
import { ChatMessageList } from './components/ChatMessageList'
import { StatusBar } from './components/StatusBar'
import { ConfigPanel } from './components/ConfigPanel'
import { recognizeIntents } from './services/intentRecognizer'
import { handleVoiceCommands } from './services/commandHandler'
import { downloadImage } from './utils/downloadImage'
import type {
  GenerateRequest,
  GenerateResponse,
  SessionContext,
  ExtractedParams,
} from '@voice-draw/shared'
import type { AudioSegment } from './hooks/useRecorder'

function App() {
  const store = useChatStore()
  const manuallyStoppedRef = useRef(false)
  const lastMessageIdRef = useRef<string | null>(null)
  const startListeningRef = useRef<() => Promise<void>>(async () => {})
  const stopListeningRef = useRef<() => void>(() => {})
  const handleAudioSegmentRef = useRef<(segment: AudioSegment) => Promise<void>>(
    async () => {}
  )

  const recorder = useRecorder({
    onSegment: (segment) => handleAudioSegmentRef.current(segment),
    onSpeakingChange: (isSpeaking) => store.setSpeaking(isSpeaking),
    onSilenceDurationChange: (ms) => store.setSilenceDuration(ms),
  })

  const buildContext = useCallback((): SessionContext | null => {
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
  }, [
    store.messages,
    store.sessionId,
    store.currentParams,
    store.currentImageUrl,
    store.pendingClarification,
  ])

  const handleResult = useCallback(
    (result: GenerateResponse) => {
      const userTranscript =
        result.updated_context?.conversation_history
          ?.slice()
          .reverse()
          .find(
            (m: { type: string; role: string; content: string }) =>
              m.type === 'voice' && m.role === 'user'
          )?.content || ''
      if (lastMessageIdRef.current) {
        store.updateUserMessage(lastMessageIdRef.current, userTranscript)
      }

      if (result.status === 'need_clarification') {
        store.setClarifying(
          result.response || '',
          result.suggestions || [],
          (result.extracted as ExtractedParams | null) || null
        )
      } else if (result.status === 'complete') {
        store.setImageReady(
          result.response || '',
          result.image_url || null,
          (result.extracted as ExtractedParams | null) || null
        )
      } else {
        store.setError(result.response || '处理失败，请重试')
      }
    },
    [store]
  )

  const startListening = useCallback(async () => {
    if (store.appState === 'recording' || store.appState === 'processing') {
      return
    }
    manuallyStoppedRef.current = false
    store.setListening()
    try {
      await recorder.startRecording()
    } catch (err) {
      store.setIdle()
      store.setError(
        err instanceof Error ? err.message : '无法访问麦克风，请检查权限设置'
      )
    }
  }, [store, recorder])

  startListeningRef.current = startListening

  const stopListening = useCallback(() => {
    manuallyStoppedRef.current = true
    recorder.stopRecording()
    store.setIdle()
  }, [store, recorder])

  stopListeningRef.current = stopListening

  const resumeListeningIfNeeded = useCallback(async () => {
    if (!manuallyStoppedRef.current && store.appState !== 'processing') {
      await startListeningRef.current()
    }
  }, [store.appState])

  const processCreativeInput = useCallback(
    async (text: string) => {
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
        await resumeListeningIfNeeded()
      }
    },
    [store, buildContext, handleResult, resumeListeningIfNeeded]
  )

  const handleAudioSegment = useCallback(
    async (segment: AudioSegment) => {
      if (!segment.blob || segment.blob.size === 0) return
      // AI 处理中时不处理新的语音片段，避免并发请求和状态混乱
      if (store.appState === 'processing') return

      const { id } = store.addUserVoiceMessage(segment.blob)
      lastMessageIdRef.current = id
      store.setProcessing()

      try {
        const transcribeResult = await transcribeAudio(segment.blob)
        if (
          !transcribeResult.success ||
          !transcribeResult.transcript?.trim()
        ) {
          store.updateUserMessage(id, '（未能识别）')
          store.setError('没能听清，请再说一次')
          await resumeListeningIfNeeded()
          return
        }

        const text = transcribeResult.transcript.trim()
        store.updateUserMessage(id, text)

        const intents = recognizeIntents(text)
        const isCommand =
          intents.length > 0 && intents.every((i) => i.type !== 'unknown')

        if (isCommand) {
          const result = await handleVoiceCommands(intents, {
            resetChat: () => store.resetChat(),
            setNextEditMode: (mode) => store.setNextEditMode(mode),
            currentImageUrl: store.currentImageUrl,
            downloadImage,
          })

          if (result.handled) {
            if (result.feedback) {
              store.addAssistantMessage(result.feedback)
            }
            if (result.shouldResume) {
              await startListeningRef.current()
            } else {
              // 停止命令需要真正关闭麦克风
              stopListeningRef.current()
            }
            return
          }
        }

        // 非命令：走创作/修改流程
        await processCreativeInput(text)
      } catch (error) {
        console.error('处理失败:', error)
        store.setError(
          error instanceof Error ? error.message : '请求失败，请重试'
        )
        await resumeListeningIfNeeded()
      }
    },
    [store, processCreativeInput, resumeListeningIfNeeded]
  )

  handleAudioSegmentRef.current = handleAudioSegment

  const toggleListening = useCallback(async () => {
    if (store.appState === 'recording') {
      stopListening()
    } else if (store.appState !== 'processing') {
      await startListening()
    }
  }, [store.appState, startListening, stopListening])

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
              <ChatMessageList messages={store.messages} />
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full">
            <StatusBar
              appState={store.appState}
              isSpeaking={store.isSpeaking}
              silenceDuration={store.silenceDuration}
            />
          </div>

          <div className="bg-white border-t border-gray-200 px-4 py-4">
            <div className="max-w-md mx-auto flex items-center justify-center">
              <RecorderButton
                isListening={store.appState === 'recording'}
                isSpeaking={store.isSpeaking}
                isBusy={isBusy}
                silenceDuration={store.silenceDuration}
                error={recorder.error}
                onToggle={toggleListening}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
