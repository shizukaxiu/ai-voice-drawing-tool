import OpenAI from 'openai'

export function createDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未配置')
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  })
}

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
