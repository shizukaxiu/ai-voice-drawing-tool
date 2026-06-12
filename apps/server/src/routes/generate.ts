import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { GenerateResponse, GenerateRequest } from '@voice-draw/shared'

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

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({
        status: 'error',
        force_generate: false,
        edit_mode: 'image_edit',
        extracted: null,
        clarification_question: '',
        suggestions: [],
        response: '没有收到音频文件',
        image_url: null,
        updated_context: null,
      })
    }

    const request: GenerateRequest = {
      session_id: req.body.session_id || 'default-session',
      context: req.body.context ? JSON.parse(req.body.context) : null,
      edit_mode: req.body.edit_mode || 'image_edit',
    }

    console.log('收到音频文件:', file.filename)
    console.log('文件大小:', file.size)
    console.log('请求参数:', request)

    // TODO: 后续接入 ASR、LLM、图像生成
    // 当前仅返回占位响应，证明上传链路通
    const response: GenerateResponse = {
      status: 'complete',
      force_generate: false,
      edit_mode: request.edit_mode,
      extracted: null,
      clarification_question: '',
      suggestions: [],
      response: `已收到音频文件 ${file.filename}，后续将接入 ASR 和图像生成`,
      image_url: null,
      updated_context: request.context,
    }

    res.json(response)
  } catch (error) {
    console.error('处理上传失败:', error)
    res.status(500).json({
      status: 'error',
      force_generate: false,
      edit_mode: 'image_edit',
      extracted: null,
      clarification_question: '',
      suggestions: [],
      response: '服务器处理失败',
      image_url: null,
      updated_context: null,
    })
  }
})

export default router
