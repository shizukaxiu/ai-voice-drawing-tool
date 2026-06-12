import type { GenerateResponse, GenerateRequest } from '@voice-draw/shared'
import { useConfigStore } from '../store/useConfigStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function getConfigHeaders(): Record<string, string> {
  const config = useConfigStore.getState()
  const headers: Record<string, string> = {}
  if (config.iflytekAppId) headers['X-IFLYTEK-APP-ID'] = config.iflytekAppId
  if (config.iflytekApiKey) headers['X-IFLYTEK-API-KEY'] = config.iflytekApiKey
  if (config.iflytekApiSecret)
    headers['X-IFLYTEK-API-SECRET'] = config.iflytekApiSecret
  if (config.deepseekApiKey) headers['X-DEEPSEEK-API-KEY'] = config.deepseekApiKey
  if (config.dashscopeApiKey)
    headers['X-DASHSCOPE-API-KEY'] = config.dashscopeApiKey
  if (config.dashscopeImageModel)
    headers['X-DASHSCOPE-IMAGE-MODEL'] = config.dashscopeImageModel
  if (config.deepseekModel) headers['X-DEEPSEEK-MODEL'] = config.deepseekModel
  return headers
}

export async function uploadAudio(
  audioBlob: Blob,
  request: GenerateRequest
): Promise<GenerateResponse> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  formData.append('session_id', request.session_id)
  formData.append('context', JSON.stringify(request.context))
  formData.append('edit_mode', request.edit_mode)

  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: getConfigHeaders(),
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function sendText(
  text: string,
  request: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getConfigHeaders(),
    },
    body: JSON.stringify({
      text,
      session_id: request.session_id,
      context: request.context,
      edit_mode: request.edit_mode,
    }),
  })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
