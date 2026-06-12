import type { GenerateResponse, GenerateRequest } from '@voice-draw/shared'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
