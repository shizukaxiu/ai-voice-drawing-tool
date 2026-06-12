import type { ExtractedParams } from '@voice-draw/shared'

export interface EditPromptResult {
  prompt: string
  negative_prompt: string
}

const defaultNegative =
  '低质量，模糊，变形，多余肢体，畸形，丑陋，崩坏，文字，水印，签名，噪点，过曝，欠曝'

function extractRemovedObjects(input: string): string[] {
  const removePattern = /(?:去掉|删除|移除|去除|不要)\s*([，,、\s]*[^，,。！!?？]+)/g
  const objects: string[] = []
  let match: RegExpExecArray | null
  while ((match = removePattern.exec(input)) !== null) {
    const raw = match[1].trim()
    // 简单切分并列元素
    const parts = raw.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
    objects.push(...parts)
  }
  return objects
}

export function buildEditPrompt(
  userInput: string,
  extracted: ExtractedParams
): EditPromptResult {
  const trimmedInput = userInput.trim().replace(/[。！!?？]$/, '')
  const removedObjects = extractRemovedObjects(trimmedInput)

  let prompt = trimmedInput
  // 让指令更明确
  if (removedObjects.length > 0) {
    prompt = `${trimmedInput}，保留其他部分不变`
  } else {
    prompt = `${trimmedInput}，保持画面其他部分不变`
  }

  const negativeParts = [defaultNegative]
  if (removedObjects.length > 0) {
    negativeParts.push(...removedObjects)
    negativeParts.push('遮挡', '面具')
  }

  return {
    prompt,
    negative_prompt: [...new Set(negativeParts)].join('，'),
  }
}
