import OpenAI from 'openai'
import type { EditMode, ExtractedParams, Stage2Result } from '@voice-draw/shared'
import { createDeepSeekClient, DEEPSEEK_MODEL } from './deepseek'
import {
  buildStage2SystemPrompt,
  buildStage2UserPrompt,
} from '../prompts/stage2'

function stripJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function normalizeStage2Result(parsed: any): Stage2Result {
  return {
    prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
    negative_prompt:
      typeof parsed.negative_prompt === 'string' ? parsed.negative_prompt : '',
  }
}

export async function expandPrompt(
  extracted: ExtractedParams,
  editMode: EditMode
): Promise<Stage2Result> {
  const client = createDeepSeekClient()
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildStage2SystemPrompt() },
    {
      role: 'user',
      content: buildStage2UserPrompt(extracted, editMode),
    },
  ]

  const callLLM = async (): Promise<string> => {
    const completion = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    return completion.choices[0]?.message?.content || ''
  }

  let raw = await callLLM()
  try {
    const parsed = JSON.parse(stripJson(raw))
    return normalizeStage2Result(parsed)
  } catch (firstErr) {
    console.warn('Stage 2 首次 JSON 解析失败，尝试重试:', firstErr)
    messages.push({ role: 'assistant', content: raw })
    messages.push({
      role: 'user',
      content:
        '你刚才的输出不是合法的 JSON，请重新输出，只输出 JSON 对象，不要包含 Markdown 代码块。',
    })

    raw = await callLLM()
    try {
      const parsed = JSON.parse(stripJson(raw))
      return normalizeStage2Result(parsed)
    } catch (secondErr) {
      console.error('Stage 2 重试后仍解析失败:', secondErr)
      throw new Error('Prompt 扩写失败')
    }
  }
}
