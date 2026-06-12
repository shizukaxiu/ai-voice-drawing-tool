import { useRecorder } from './hooks/useRecorder'
import { RecorderButton } from './components/RecorderButton'
import { uploadAudio } from './services/api'
import type { GenerateRequest } from '@voice-draw/shared'

function App() {
  const recorder = useRecorder()

  const handleRecordingComplete = async (audioBlob: Blob) => {
    console.log('录音完成，大小:', audioBlob.size, '类型:', audioBlob.type)

    const request: GenerateRequest = {
      session_id: 'demo-session',
      context: null,
      edit_mode: 'image_edit',
    }

    try {
      const result = await uploadAudio(audioBlob, request)
      console.log('上传结果:', result)
      alert(`上传成功！后端返回: ${result.response}`)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请稍后重试')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <h1 className="text-xl font-bold text-center text-gray-900">
          AI 语音绘图工具
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-8 text-center">
          按住下方按钮开始语音描述你想要的画面
        </p>
        <RecorderButton
          recorder={recorder}
          onRecordingComplete={handleRecordingComplete}
        />
      </main>
    </div>
  )
}

export default App
