import type { AppState } from '@voice-draw/shared'

interface StatusBarProps {
  appState: AppState
}

const statusText: Record<AppState, string> = {
  idle: '按住下方按钮，语音描述你想要的画面',
  recording: '录音中… 松开发送',
  processing: 'AI 正在识别、理解并绘制…',
  clarifying: '信息不足，请按提示补充',
  image_ready: '图片已生成，可以继续语音修改',
  modifying: '正在基于当前图片修改…',
}

export function StatusBar({ appState }: StatusBarProps) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 py-2 text-center">
      <span className="text-xs text-gray-500">{statusText[appState]}</span>
    </div>
  )
}
