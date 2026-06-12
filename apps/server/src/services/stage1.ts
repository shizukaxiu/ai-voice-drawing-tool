import type { EditMode, SessionContext, Stage1Result } from '@voice-draw/shared'
import OpenAI from 'openai'
import { createDeepSeekClient, getDeepSeekModel } from './deepseek'
import {
  buildStage1SystemPrompt,
  buildStage1UserPrompt,
} from '../prompts/stage1'

function stripJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function normalizeStage1Result(
  parsed: any,
  fallbackEditMode: EditMode
): Stage1Result {
  const extracted = parsed.extracted || {}
  return {
    status: parsed.status || 'need_clarification',
    force_generate: !!parsed.force_generate,
    edit_mode: parsed.edit_mode || fallbackEditMode,
    extracted: {
      subject: extracted.subject ?? null,
      action: extracted.action ?? null,
      scene: extracted.scene ?? null,
      style: extracted.style ?? null,
      color_tone: extracted.color_tone ?? null,
      mood: extracted.mood ?? null,
      details: Array.isArray(extracted.details) ? extracted.details : [],
      composition: extracted.composition ?? null,
    },
    missing_fields: Array.isArray(parsed.missing_fields)
      ? parsed.missing_fields
      : [],
    clarification_question: parsed.clarification_question || '',
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    response: parsed.response || '',
  }
}

export async function extractStage1(
  userInput: string,
  context: SessionContext | null,
  editMode: EditMode
): Promise<Stage1Result> {
  const client = createDeepSeekClient()
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildStage1SystemPrompt() },
    {
      role: 'user',
      content: buildStage1UserPrompt(userInput, context, editMode),
    },
  ]

  const callLLM = async (): Promise<string> => {
    const completion = await client.chat.completions.create({
      model: getDeepSeekModel(),
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8192,
    })
    return completion.choices[0]?.message?.content || ''
  }

  let raw = await callLLM()
  try {
    const parsed = JSON.parse(stripJson(raw))
    return normalizeStage1Result(parsed, editMode)
  } catch (firstErr) {
    console.warn('Stage 1 首次 JSON 解析失败，尝试重试:', firstErr)
    messages.push({
      role: 'assistant',
      content: raw,
    })
    messages.push({
      role: 'user',
      content:
        '你刚才的输出不是合法的 JSON，请重新输出，只输出 JSON 对象，不要包含 Markdown 代码块。',
    })

    raw = await callLLM()
    try {
      const parsed = JSON.parse(stripJson(raw))
      return normalizeStage1Result(parsed, editMode)
    } catch (secondErr) {
      console.error('Stage 1 重试后仍解析失败:', secondErr)
      throw new Error('意图理解失败')
    }
  }
}
