import { create } from 'zustand'
import type {
  AppState,
  ChatMessage,
  EditMode,
  ExtractedParams,
} from '@voice-draw/shared'

export interface DisplayMessage extends ChatMessage {
  id: string
  audioUrl?: string
  suggestions?: string[]
  extracted?: ExtractedParams | null
}

interface ChatStore {
  appState: AppState
  messages: DisplayMessage[]
  sessionId: string
  currentImageUrl: string | null
  currentParams: ExtractedParams | null
  pendingClarification: boolean
  nextEditMode: EditMode
  isRecording: boolean
  recordingDuration: number
  /** 当前是否检测到用户正在说话 */
  isSpeaking: boolean
  /** 当前已持续静音时长（毫秒） */
  silenceDuration: number

  startRecording: () => void
  stopRecording: () => void
  setListening: () => void
  setIdle: () => void
  setSpeaking: (value: boolean) => void
  setSilenceDuration: (ms: number) => void
  addUserVoiceMessage: (blob: Blob) => { id: string; audioUrl: string }
  addUserTextMessage: (text: string) => string
  updateUserMessage: (id: string, content: string) => void
  setProcessing: () => void
  setClarifying: (
    response: string,
    suggestions: string[],
    extracted?: ExtractedParams | null
  ) => void
  setImageReady: (
    response: string,
    imageUrl: string | null,
    extracted: ExtractedParams | null
  ) => void
  setError: (message: string) => void
  resetChat: () => void
  setNextEditMode: (mode: EditMode) => void
  /** 添加一条 assistant 反馈消息（用于本地命令反馈） */
  addAssistantMessage: (content: string) => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createInitialSessionId(): string {
  return `session-${Date.now()}`
}

export const useChatStore = create<ChatStore>((set) => ({
  appState: 'idle',
  messages: [],
  sessionId: createInitialSessionId(),
  currentImageUrl: null,
  currentParams: null,
  pendingClarification: false,
  nextEditMode: 'image_edit',
  isRecording: false,
  recordingDuration: 0,
  isSpeaking: false,
  silenceDuration: 0,

  startRecording: () =>
    set({
      appState: 'recording',
      isRecording: true,
      recordingDuration: 0,
      isSpeaking: false,
      silenceDuration: 0,
    }),

  stopRecording: () =>
    set({
      isRecording: false,
      isSpeaking: false,
      silenceDuration: 0,
    }),

  setListening: () =>
    set({
      appState: 'recording',
      isRecording: true,
      isSpeaking: false,
      silenceDuration: 0,
    }),

  setIdle: () =>
    set({
      appState: 'idle',
      isRecording: false,
      isSpeaking: false,
      silenceDuration: 0,
    }),

  setSpeaking: (value) => set({ isSpeaking: value }),

  setSilenceDuration: (ms) => set({ silenceDuration: ms }),

  addUserVoiceMessage: (blob: Blob) => {
    const id = generateId()
    const audioUrl = URL.createObjectURL(blob)
    const message: DisplayMessage = {
      id,
      role: 'user',
      content: '',
      type: 'voice',
      created_at: new Date().toISOString(),
      audioUrl,
    }
    set((state) => ({
      messages: [...state.messages, message],
    }))
    return { id, audioUrl }
  },

  addUserTextMessage: (text: string) => {
    const id = generateId()
    const message: DisplayMessage = {
      id,
      role: 'user',
      content: text,
      type: 'text',
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      messages: [...state.messages, message],
    }))
    return id
  },

  updateUserMessage: (id: string, content: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    })),

  setProcessing: () =>
    set({
      appState: 'processing',
      isSpeaking: false,
      silenceDuration: 0,
    }),

  setClarifying: (
    response: string,
    suggestions: string[],
    extracted: ExtractedParams | null = null
  ) =>
    set((state) => ({
      appState: 'clarifying',
      pendingClarification: true,
      currentParams: extracted ?? state.currentParams,
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: 'assistant',
          content: response,
          type: 'text',
          created_at: new Date().toISOString(),
          suggestions,
        } as DisplayMessage,
      ],
    })),

  setImageReady: (
    response: string,
    imageUrl: string | null,
    extracted: ExtractedParams | null
  ) =>
    set((state) => {
      const newMessages: DisplayMessage[] = [
        ...state.messages,
        {
          id: generateId(),
          role: 'assistant',
          content: response,
          type: 'text',
          created_at: new Date().toISOString(),
        },
      ]
      if (imageUrl) {
        newMessages.push({
          id: generateId(),
          role: 'assistant',
          content: imageUrl,
          type: 'image',
          created_at: new Date().toISOString(),
        })
      }
      return {
        appState: 'image_ready',
        pendingClarification: false,
        currentImageUrl: imageUrl,
        currentParams: extracted,
        messages: newMessages,
        isSpeaking: false,
        silenceDuration: 0,
      }
    }),

  setError: (message: string) =>
    set((state) => ({
      appState: 'idle',
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: 'assistant',
          content: message,
          type: 'text',
          created_at: new Date().toISOString(),
        },
      ],
      isSpeaking: false,
      silenceDuration: 0,
    })),

  resetChat: () =>
    set({
      appState: 'idle',
      messages: [],
      sessionId: createInitialSessionId(),
      currentImageUrl: null,
      currentParams: null,
      pendingClarification: false,
      nextEditMode: 'image_edit',
      isRecording: false,
      recordingDuration: 0,
      isSpeaking: false,
      silenceDuration: 0,
    }),

  setNextEditMode: (mode: EditMode) =>
    set({
      nextEditMode: mode,
    }),

  addAssistantMessage: (content: string) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: 'assistant',
          content,
          type: 'text',
          created_at: new Date().toISOString(),
        } as DisplayMessage,
      ],
    })),
}))
