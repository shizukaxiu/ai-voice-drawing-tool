import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import generateRoutes from './routes/generate'
import generateTextRoutes from './routes/generateText'
import { apiConfigMiddleware } from './middleware/apiConfig'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())
app.use(apiConfigMiddleware)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AI 语音绘图工具后端服务运行中' })
})

app.use('/api/generate', generateRoutes)
app.use('/api/generate-text', generateTextRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
