import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ApiConfig {
  iflytekAppId: string
  iflytekApiKey: string
  iflytekApiSecret: string
  deepseekApiKey: string
  dashscopeApiKey: string
  dashscopeImageModel: string
  deepseekModel: string
}

interface ConfigStore extends ApiConfig {
  saved: boolean
  setConfig: (partial: Partial<ApiConfig>) => void
  saveConfig: () => void
}

const defaultConfig: ApiConfig = {
  iflytekAppId: '',
  iflytekApiKey: '',
  iflytekApiSecret: '',
  deepseekApiKey: '',
  dashscopeApiKey: '',
  dashscopeImageModel: 'wanx2.1-t2i-turbo',
  deepseekModel: 'deepseek-chat',
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      ...defaultConfig,
      saved: false,
      setConfig: (partial) => set((state) => ({ ...state, ...partial })),
      saveConfig: () => {
        set({ saved: true })
        setTimeout(() => set({ saved: false }), 2000)
      },
    }),
    {
      name: 'voice-draw-config',
      partialize: (state) => ({
        iflytekAppId: state.iflytekAppId,
        iflytekApiKey: state.iflytekApiKey,
        iflytekApiSecret: state.iflytekApiSecret,
        deepseekApiKey: state.deepseekApiKey,
        dashscopeApiKey: state.dashscopeApiKey,
        dashscopeImageModel: state.dashscopeImageModel,
        deepseekModel: state.deepseekModel,
      }),
    }
  )
)
