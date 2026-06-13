import type { AppState } from '@voice-draw/shared'

interface StatusBarProps {
  appState: AppState
  isSpeaking?: boolean
  silenceDuration?: number
}

const statusText: Record<AppState, string> = {
  idle: '点击下方按钮，开始语音对话',
  recording: '聆听中…',
  processing: 'AI 正在识别、理解并绘制…',
  clarifying: '信息不足，请语音补充',
  image_ready: '图片已生成，可以继续语音修改',
  modifying: '正在基于当前图片修改…',
}

export function StatusBar({
  appState,
  isSpeaking = false,
  silenceDuration = 0,
}: StatusBarProps) {
  let text = statusText[appState]

  if (appState === 'recording') {
    if (isSpeaking) {
      text = '正在听你说话…'
    } else {
      const remaining = Math.max(0, 3000 - silenceDuration)
      if (remaining < 800) {
        text = '检测到停顿，即将发送…'
      } else {
        text = '聆听中，请说话（停顿 3 秒自动发送）'
      }
    }
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200 py-2 text-center">
      <span className="text-xs text-gray-500">{text}</span>
    </div>
  )
}
