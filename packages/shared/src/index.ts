// AI 语音绘图工具 — 前后端共享类型

/** 图像参数结构（Stage 1 输出） */
export interface ExtractedParams {
  subject: string | null
  action: string | null
  scene: string | null
  style: string | null
  color_tone: string | null
  mood: string | null
  details: string[]
  composition: string | null
}

/** 生成/编辑模式 */
export type EditMode = 'image_edit' | 'regenerate'

/** Stage 1 LLM 输出 */
export interface Stage1Result {
  status: 'complete' | 'need_clarification' | 'error'
  force_generate: boolean
  edit_mode: EditMode
  extracted: ExtractedParams
  missing_fields: string[]
  clarification_question: string
  suggestions: string[]
  response: string
}

/** Stage 2 LLM 输出 */
export interface Stage2Result {
  prompt: string
  negative_prompt: string
}

/** 聊天消息 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  type: 'voice' | 'text' | 'image'
  created_at?: string
}

/** 会话上下文 */
export interface SessionContext {
  session_id: string
  current_params: ExtractedParams | null
  current_image_url: string | null
  conversation_history: ChatMessage[]
  pending_clarification: boolean
  mode: 'creating' | 'modifying'
}

/** 前端应用状态 */
export type AppState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'clarifying'
  | 'image_ready'
  | 'modifying'

/** API 响应 */
export interface GenerateResponse {
  status: 'complete' | 'need_clarification' | 'error'
  force_generate: boolean
  edit_mode: EditMode
  extracted: ExtractedParams | null
  clarification_question: string
  suggestions: string[]
  response: string
  image_url: string | null
  updated_context: SessionContext | null
}

/** API 请求 */
export interface GenerateRequest {
  session_id: string
  context: SessionContext | null
  edit_mode: EditMode
}
