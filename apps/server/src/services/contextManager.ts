import type {
  ChatMessage,
  ExtractedParams,
  SessionContext,
  Stage1Result,
} from '@voice-draw/shared'

export function createInitialContext(sessionId: string): SessionContext {
  return {
    session_id: sessionId,
    current_params: null,
    current_image_url: null,
    conversation_history: [],
    pending_clarification: false,
    mode: 'creating',
  }
}

export function buildContextAfterStage1(
  sessionId: string,
  context: SessionContext | null,
  transcript: string,
  stage1: Stage1Result,
  imageUrl: string | null = null
): SessionContext {
  const base = context || createInitialContext(sessionId)
  const now = new Date().toISOString()

  const userMessage: ChatMessage = {
    role: 'user',
    content: transcript,
    type: 'voice',
    created_at: now,
  }

  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: stage1.response,
    type: 'text',
    created_at: now,
  }

  const updated: SessionContext = {
    ...base,
    session_id: sessionId,
    current_params:
      stage1.status === 'complete'
        ? stage1.extracted
        : (stage1.extracted ?? base.current_params),
    pending_clarification: stage1.status === 'need_clarification',
    mode:
      base.mode === 'creating' && stage1.status === 'complete'
        ? 'modifying'
        : base.mode,
    conversation_history: [
      ...base.conversation_history,
      userMessage,
      assistantMessage,
    ],
  }

  if (imageUrl) {
    updated.current_image_url = imageUrl
    updated.conversation_history.push({
      role: 'assistant',
      content: imageUrl,
      type: 'image',
      created_at: now,
    })
  }

  return updated
}

export function mergeExtractedParams(
  base: ExtractedParams | null,
  update: ExtractedParams | null
): ExtractedParams | null {
  if (!base) return update
  if (!update) return base
  return {
    subject: update.subject ?? base.subject,
    action: update.action ?? base.action,
    scene: update.scene ?? base.scene,
    style: update.style ?? base.style,
    color_tone: update.color_tone ?? base.color_tone,
    mood: update.mood ?? base.mood,
    details:
      update.details.length > 0 ? update.details : base.details,
    composition: update.composition ?? base.composition,
  }
}
