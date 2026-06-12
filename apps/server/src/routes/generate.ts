import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { GenerateResponse, GenerateRequest } from '@voice-draw/shared'
import { convertToPcm } from '../services/audioConverter'
import { transcribeAudio, type IFlytekASRConfig } from '../services/iflytekASR'
import { extractStage1 } from '../services/stage1'
import { buildContextAfterStage1 } from '../services/contextManager'

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

    // 2. Stage 1 意图理解
    let stage1Result
    try {
      stage1Result = await extractStage1(
        transcript,
        request.context,
        request.edit_mode
      )
      console.log('Stage 1 结果:', stage1Result)
    } catch (llmError) {
      console.error('Stage 1 处理失败:', llmError)
      return res.status(503).json(makeErrorResponse('理解需求失败，请重新描述'))
    }

    // 3. 组装响应与更新后的上下文
    const updatedContext = buildContextAfterStage1(
      request.session_id,
      request.context,
      transcript,
      stage1Result,
      null
    )

    if (stage1Result.status === 'error') {
      return res.status(503).json(makeErrorResponse('理解需求失败，请重新描述'))
    }

    const response: GenerateResponse = {
      status: stage1Result.status,
      force_generate: stage1Result.force_generate,
      edit_mode: stage1Result.edit_mode,
      extracted: stage1Result.extracted,
      clarification_question: stage1Result.clarification_question,
      suggestions: stage1Result.suggestions,
      response: stage1Result.response,
      image_url: null,
      updated_context: updatedContext,
    }

    res.json(response)
  } catch (error) {
    console.error('处理上传失败:', error)
    res.status(500).json(makeErrorResponse('服务器处理失败'))
  }
})

export default router
