import type { EditMode } from '@voice-draw/shared'
import type { VoiceIntent } from './intentRecognizer'

export interface CommandContext {
  /** 重置当前会话 */
  resetChat: () => void
  /** 设置下一次生成/编辑模式 */
  setNextEditMode: (mode: EditMode) => void
  /** 当前生成的图片 URL */
  currentImageUrl: string | null
  /** 下载图片到本地 */
  downloadImage: (url: string) => Promise<void>
}

export interface HandledResult {
  /** 是否被识别为命令 */
  handled: boolean
  /** 反馈给用户的话术 */
  feedback?: string
  /** 执行后是否应恢复聆听 */
  shouldResume: boolean
}

async function handleSingleCommand(
  intent: VoiceIntent,
  context: CommandContext
): Promise<HandledResult> {
  switch (intent.type) {
    case 'start':
      return {
        handled: true,
        feedback: '好的，我在听。',
        shouldResume: true,
      }

    case 'stop':
      return {
        handled: true,
        feedback: '已暂停聆听，点击按钮可以继续。',
        shouldResume: false,
      }

    case 'regenerate':
      context.setNextEditMode('regenerate')
      return {
        handled: true,
        feedback: '好的，请描述你想重新画成什么样。',
        shouldResume: true,
      }

    case 'new_chat':
      context.resetChat()
      return {
        handled: true,
        feedback: '已开启新对话，请描述你想要的画面。',
        shouldResume: true,
      }

    case 'save_image':
      if (!context.currentImageUrl) {
        return {
          handled: true,
          feedback: '还没有可保存的图片，你可以先让我画一张。',
          shouldResume: true,
        }
      }
      try {
        await context.downloadImage(context.currentImageUrl)
        return {
          handled: true,
          feedback: '图片已保存到本地。',
          shouldResume: true,
        }
      } catch {
        return {
          handled: true,
          feedback: '保存失败，请点击图片放大后手动下载。',
          shouldResume: true,
        }
      }

    case 'continue_modify':
      context.setNextEditMode('image_edit')
      return {
        handled: true,
        feedback: '请说你想修改哪里。',
        shouldResume: true,
      }

    case 'unknown':
    default:
      return { handled: false, shouldResume: true }
  }
}

/**
 * 顺序执行识别到的多条命令，并合并反馈话术。
 * 只要包含非命令意图，就整体返回未处理，由外层走 LLM 流程。
 */
export async function handleVoiceCommands(
  intents: VoiceIntent[],
  context: CommandContext
): Promise<HandledResult> {
  if (intents.length === 0) {
    return { handled: false, shouldResume: true }
  }

  // 安全过滤：只有全部是已知命令时才执行
  const hasUnknown = intents.some((i) => i.type === 'unknown')
  if (hasUnknown) {
    return { handled: false, shouldResume: true }
  }

  const results: HandledResult[] = []
  for (const intent of intents) {
    results.push(await handleSingleCommand(intent, context))
  }

  const feedback = results
    .map((r) => r.feedback)
    .filter(Boolean)
    .join('')

  // 连续命令中，只要最后一条命令要求暂停，就暂停；否则恢复聆听
  const last = results[results.length - 1]

  return {
    handled: true,
    feedback,
    shouldResume: last.shouldResume,
  }
}
