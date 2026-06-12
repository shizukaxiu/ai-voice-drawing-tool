import OpenAI from 'openai'
import { getApiConfig, type ApiConfig } from './apiConfig'

export function createDeepSeekClient(config?: ApiConfig): OpenAI {
  const cfg = config || getApiConfig()
  const apiKey = cfg.deepseekApiKey || process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未配置')
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  })
}

export function getDeepSeekModel(config?: ApiConfig): string {
  const cfg = config || getApiConfig()
  return cfg.deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat'
}
