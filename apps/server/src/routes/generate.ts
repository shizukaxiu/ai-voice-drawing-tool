import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { GenerateResponse, GenerateRequest } from '@voice-draw/shared'
import { convertToPcm } from '../services/audioConverter'
import { transcribeAudio, type IFlytekASRConfig } from '../services/iflytekASR'

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
  const appId = process.env.IFLYTEK_APP_ID
  const apiKey = process.env.IFLYTEK_API_KEY
  const apiSecret = process.env.IFLYTEK_API_SECRET
  if (!appId || !apiKey || !apiSecret) {
    return null
  }
  return { appId, apiKey, apiSecret }
}

function makeErrorResponse(message: string): GenerateResponse {
  return {
    status: 'error',
    force_generate: false,
    edit_mode: 'image_edit',
    extracted: null,
    clarification_question: '',
    suggestions: [],
    response: message,
    image_url: null,
    updated_context: null,
  }
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

    const asrConfig = getASRConfig()
    if (!asrConfig) {
      console.warn('讯飞 ASR 环境变量未配置')
      return res
        .status(503)
        .json(makeErrorResponse('语音识别服务未配置，请联系管理员'))
    }

    let text: string
    try {
      const pcmBuffer = await convertToPcm(file.path)
      console.log('PCM 转换完成，字节数:', pcmBuffer.length)
      text = await transcribeAudio(pcmBuffer, asrConfig)
      console.log('ASR 识别结果:', text)
    } catch (asrError) {
      console.error('ASR 处理失败:', asrError)
      return res
        .status(503)
        .json(makeErrorResponse('语音识别失败，请重新录制'))
    }

    if (!text || text.trim().length === 0) {
      return res
        .status(200)
        .json(makeErrorResponse('未能识别到语音内容，请重新录制'))
    }

    // TODO: 将识别文本送入 Stage 1/2 LLM 并生成图片
    const response: GenerateResponse = {
      status: 'complete',
      force_generate: false,
      edit_mode: request.edit_mode,
      extracted: null,
      clarification_question: '',
      suggestions: [],
      response: `识别结果：${text}`,
      image_url: null,
      updated_context: request.context,
    }

    res.json(response)
  } catch (error) {
    console.error('处理上传失败:', error)
    res.status(500).json(makeErrorResponse('服务器处理失败'))
  }
})

export default router
