import type { GenerateRequest, GenerateResponse, ExtractedParams } from '@voice-draw/shared'
import { extractStage1 } from '../services/stage1'
import { expandPrompt } from '../services/stage2'
import { buildEditPrompt } from '../services/editPromptBuilder'
import { generateImage, editImage } from '../services/imageGeneration'
import {
  buildContextAfterStage1,
  applyStage2ToContext,
  addImageToContext,
  mergeExtractedParams,
} from '../services/contextManager'

export function makeErrorResponse(message: string): GenerateResponse {
  return {
    status: 'error',
    force_generate: false,
    edit_mode: 'image_edit',
    extracted: null,
    clarification_question: '',
    suggestions: [],
    response: message,
    prompt: null,
    negative_prompt: null,
    image_url: null,
    updated_context: null,
  }
}

export async function processGeneratePipeline(
  userInput: string,
  request: GenerateRequest
): Promise<GenerateResponse> {
  // 1. Stage 1 意图理解
  let stage1Result
  try {
    stage1Result = await extractStage1(
      userInput,
      request.context,
      request.edit_mode
    )
    console.log('Stage 1 结果:', stage1Result)
  } catch (llmError) {
    console.error('Stage 1 处理失败:', llmError)
    return makeErrorResponse('理解需求失败，请重新描述')
  }

  // 2. 强制生成时合并历史参数，避免信息丢失
  if (
    stage1Result.force_generate &&
    stage1Result.status === 'complete' &&
    request.context?.current_params
  ) {
    stage1Result.extracted = mergeExtractedParams(
      request.context.current_params,
      stage1Result.extracted
    ) as ExtractedParams
  }

  // 如果强制生成后仍缺少主体，改为追问
  if (
    stage1Result.force_generate &&
    stage1Result.status === 'complete' &&
    (!stage1Result.extracted || !stage1Result.extracted.subject)
  ) {
    stage1Result.status = 'need_clarification'
    stage1Result.force_generate = false
    stage1Result.clarification_question =
      stage1Result.clarification_question ||
      '我还不太确定你想画什么，能再说一下主体和风格吗？'
    stage1Result.response =
      stage1Result.response || stage1Result.clarification_question
  }

  // 3. 组装响应与更新后的上下文
  let updatedContext = buildContextAfterStage1(
    request.session_id,
    request.context,
    userInput,
    stage1Result,
    null
  )

  if (stage1Result.status === 'error') {
    return makeErrorResponse('理解需求失败，请重新描述')
  }

  let prompt: string | null = null
  let negativePrompt: string | null = null
  let imageUrl: string | null = null

  // 3. Stage 2：信息完整时扩写 Prompt
  if (stage1Result.status === 'complete') {
    try {
      const mode: 'creating' | 'modifying' = updatedContext.current_image_url
        ? 'modifying'
        : 'creating'
      let stage2Result
      if (mode === 'modifying') {
        // 图生图使用确定性编辑指令，避免 LLM 扩写偏离原意
        stage2Result = buildEditPrompt(userInput, stage1Result.extracted)
        console.log('编辑 Prompt 构建完成:', stage2Result)
      } else {
        stage2Result = await expandPrompt(
          stage1Result.extracted,
          stage1Result.edit_mode,
          mode
        )
        console.log('Stage 2 扩写完成:', stage2Result)
      }
      prompt = stage2Result.prompt
      negativePrompt = stage2Result.negative_prompt
      updatedContext = applyStage2ToContext(updatedContext, stage2Result)
    } catch (stage2Error) {
      console.error('Stage 2 处理失败:', stage2Error)
      return makeErrorResponse('Prompt 扩写失败，请重新描述')
    }

    // 4. 图像生成 / 编辑
    try {
      const shouldEdit =
        stage1Result.edit_mode === 'image_edit' &&
        updatedContext.current_image_url

      if (shouldEdit) {
        imageUrl = await editImage(
          updatedContext.current_image_url!,
          prompt,
          negativePrompt || ''
        )
        console.log('图像编辑完成:', imageUrl)
      } else {
        imageUrl = await generateImage(prompt, negativePrompt || '')
        console.log('图像生成完成:', imageUrl)
      }

      updatedContext = addImageToContext(updatedContext, imageUrl)
    } catch (imageError) {
      console.error('图像生成失败:', imageError)
      return makeErrorResponse('图片生成失败，请重试')
    }
  }

  return {
    status: stage1Result.status,
    force_generate: stage1Result.force_generate,
    edit_mode: stage1Result.edit_mode,
    extracted: stage1Result.extracted,
    clarification_question: stage1Result.clarification_question,
    suggestions: stage1Result.suggestions,
    response:
      stage1Result.status === 'complete' && imageUrl
        ? `${stage1Result.response} 图片已生成。`
        : stage1Result.response,
    prompt,
    negative_prompt: negativePrompt,
    image_url: imageUrl,
    updated_context: updatedContext,
  }
}
