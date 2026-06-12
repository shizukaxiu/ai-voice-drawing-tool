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

  startRecording: () => void
  stopRecording: () => void
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

  startRecording: () =>
    set({
      appState: 'recording',
      isRecording: true,
      recordingDuration: 0,
    }),

  stopRecording: () =>
    set({
      isRecording: false,
    }),

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
    }),

  setNextEditMode: (mode: EditMode) =>
    set({
      nextEditMode: mode,
    }),
}))
