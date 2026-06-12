import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { GenerateRequest } from '@voice-draw/shared'
import { convertToPcm } from '../services/audioConverter'
import { transcribeAudio, type IFlytekASRConfig } from '../services/iflytekASR'
import { getApiConfig } from '../services/apiConfig'
import {
  processGeneratePipeline,
  makeErrorResponse,
} from '../controllers/generateController'

const router = express.Router()

// 确保上传目录存在
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
    cb(null, `recording-${timestamp}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 最大 10MB
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
      return res.status(400).json(makeErrorResponse('没有收到音频文件'))
    }

    const request: GenerateRequest = {
      session_id: req.body.session_id || 'default-session',
      context: req.body.context ? JSON.parse(req.body.context) : null,
      edit_mode: req.body.edit_mode || 'image_edit',
    }

    console.log('收到音频文件:', file.filename)
    console.log('文件大小:', file.size)
    console.log('请求参数:', request)

    // 1. ASR 转文字
    const asrConfig = getASRConfig()
    if (!asrConfig) {
      console.warn('讯飞 ASR 环境变量未配置')
      return res
        .status(503)
        .json(makeErrorResponse('语音识别服务未配置，请联系管理员'))
    }

    let transcript: string
    try {
      const pcmBuffer = await convertToPcm(file.path)
      console.log('PCM 转换完成，字节数:', pcmBuffer.length)
      transcript = await transcribeAudio(pcmBuffer, asrConfig)
      console.log('ASR 识别结果:', transcript)
    } catch (asrError) {
      console.error('ASR 处理失败:', asrError)
      return res
        .status(503)
        .json(makeErrorResponse('语音识别失败，请重新录制'))
    }

    if (!transcript || transcript.trim().length === 0) {
      return res
        .status(200)
        .json(makeErrorResponse('未能识别到语音内容，请重新录制'))
    }

    // 2. Stage 1/2 + 图像生成
    const response = await processGeneratePipeline(transcript, request)
    res.json(response)
  } catch (error) {
    console.error('处理上传失败:', error)
    res.status(500).json(makeErrorResponse('服务器处理失败'))
  }
})

export default router
