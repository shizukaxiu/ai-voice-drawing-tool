import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import type { GenerateResponse } from '@voice-draw/shared'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  const response: GenerateResponse = {
    status: 'complete',
    force_generate: false,
    edit_mode: 'image_edit',
    extracted: null,
    clarification_question: '',
    suggestions: [],
    response: 'AI 语音绘图工具后端服务运行中',
    image_url: null,
    updated_context: null,
  }
  res.json(response)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
