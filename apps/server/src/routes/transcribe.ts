import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { convertToPcm } from '../services/audioConverter'
import { transcribeAudio, type IFlytekASRConfig } from '../services/iflytekASR'
import { getApiConfig } from '../services/apiConfig'

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname) || '.webm'
    cb(null, `transcribe-${timestamp}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

function getASRConfig(): IFlytekASRConfig | null {
  const config = getApiConfig()
  const appId = config.iflytekAppId || process.env.IFLYTEK_APP_ID
  const apiKey = config.iflytekApiKey || process.env.IFLYTEK_API_KEY
  const apiSecret = config.iflytekApiSecret || process.env.IFLYTEK_API_SECRET
  if (!appId || !apiKey || !apiSecret) {
    return null
  }
  return { appId, apiKey, apiSecret }
}

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({
        success: false,
        error: '没有收到音频文件',
      })
    }

    console.log('收到转写音频文件:', file.filename)
    console.log('文件大小:', file.size)

    const asrConfig = getASRConfig()
    if (!asrConfig) {
      return res.status(503).json({
        success: false,
        error: '语音识别服务未配置，请联系管理员',
      })
    }

    let transcript: string
    try {
      const pcmBuffer = await convertToPcm(file.path)
      console.log('PCM 转换完成，字节数:', pcmBuffer.length)
      transcript = await transcribeAudio(pcmBuffer, asrConfig)
      console.log('ASR 识别结果:', transcript)
    } catch (asrError) {
      console.error('ASR 处理失败:', asrError)
      return res.status(503).json({
        success: false,
        error: '语音识别失败，请重新录制',
      })
    }

    // 清理临时文件
    try {
      fs.unlinkSync(file.path)
    } catch {
      // ignore cleanup errors
    }

    return res.json({
      success: true,
      transcript: transcript.trim(),
    })
  } catch (error) {
    console.error('转写接口失败:', error)
    return res.status(500).json({
      success: false,
      error: '服务器处理失败',
    })
  }
})

export default router
