import { AsyncLocalStorage } from 'async_hooks'

export interface ApiConfig {
  iflytekAppId?: string
  iflytekApiKey?: string
  iflytekApiSecret?: string
  deepseekApiKey?: string
  dashscopeApiKey?: string
  dashscopeImageModel?: string
  deepseekModel?: string
}

const configStorage = new AsyncLocalStorage<ApiConfig>()

export function runWithConfig<T>(config: ApiConfig, callback: () => T): T {
  return configStorage.run(config, callback)
}

export function getApiConfig(): ApiConfig {
  return (
    configStorage.getStore() || {
      iflytekAppId: process.env.IFLYTEK_APP_ID,
      iflytekApiKey: process.env.IFLYTEK_API_KEY,
      iflytekApiSecret: process.env.IFLYTEK_API_SECRET,
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      dashscopeApiKey: process.env.DASHSCOPE_API_KEY,
      dashscopeImageModel: process.env.DASHSCOPE_IMAGE_MODEL,
      deepseekModel: process.env.DEEPSEEK_MODEL,
    }
  )
}
