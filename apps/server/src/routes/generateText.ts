import express from 'express'
import type { GenerateRequest } from '@voice-draw/shared'
import { processGeneratePipeline } from '../controllers/generateController'

const router = express.Router()
router.use(express.json())

router.post('/', async (req, res) => {
  try {
    const { text, session_id, context, edit_mode } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: '缺少 text 字段' })
    }

    const request: GenerateRequest = {
      session_id: session_id || 'default-session',
      context: context || null,
      edit_mode: edit_mode || 'image_edit',
    }

    console.log('收到文本请求:', text)
    const response = await processGeneratePipeline(text, request)
    res.json(response)
  } catch (error) {
    console.error('文本生成处理失败:', error)
    res.status(500).json({ error: '服务器处理失败' })
  }
})

export default router
