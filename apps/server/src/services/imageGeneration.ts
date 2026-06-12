const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'
const TEXT2IMAGE_URL = `${DASHSCOPE_BASE_URL}/services/aigc/text2image/image-synthesis`
const IMAGE2IMAGE_URL = `${DASHSCOPE_BASE_URL}/services/aigc/image2image/image-synthesis`
const TASK_URL = `${DASHSCOPE_BASE_URL}/tasks`

const DEFAULT_TEXT2IMAGE_MODEL = 'wanx2.1-t2i-turbo'
const DEFAULT_IMAGE_SIZE = '1024*1024'
const POLL_INTERVAL_MS = 1500
const MAX_POLL_MS = 120_000

function getApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY
  if (!key) {
    throw new Error('DASHSCOPE_API_KEY 环境变量未配置')
  }
  return key
}

interface TaskResponse {
  request_id?: string
  output?: {
    task_id?: string
    task_status?: string
    results?: { url: string }[]
    message?: string
  }
  code?: string
  message?: string
}

async function createTask(body: unknown): Promise<string> {
  const url = body && (body as any).model === 'wanx2.1-imageedit'
    ? IMAGE2IMAGE_URL
    : TEXT2IMAGE_URL

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as TaskResponse
  if (!res.ok) {
    throw new Error(
      `创建图像任务失败 (${res.status}): ${data.message || JSON.stringify(data)}`
    )
  }

  const taskId = data.output?.task_id
  if (!taskId) {
    throw new Error(`创建图像任务未返回 task_id: ${JSON.stringify(data)}`)
  }
  return taskId
}

async function pollTask(taskId: string): Promise<string> {
  const start = Date.now()
  const url = `${TASK_URL}/${taskId}`
  const headers = { Authorization: `Bearer ${getApiKey()}` }

  while (Date.now() - start < MAX_POLL_MS) {
    const res = await fetch(url, { headers })
    const data = (await res.json()) as TaskResponse

    if (!res.ok) {
      throw new Error(
        `查询图像任务失败 (${res.status}): ${data.message || JSON.stringify(data)}`
      )
    }

    const status = data.output?.task_status
    if (status === 'SUCCEEDED') {
      const imageUrl = data.output?.results?.[0]?.url
      if (!imageUrl) {
        throw new Error(`图像任务成功但未返回 URL: ${JSON.stringify(data)}`)
      }
      return imageUrl
    }

    if (status === 'FAILED' || status === 'ERROR') {
      throw new Error(
        `图像任务失败: ${data.output?.message || JSON.stringify(data)}`
      )
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  throw new Error('等待图像生成超时')
}

export async function generateImage(
  prompt: string,
  negativePrompt: string
): Promise<string> {
  const model = process.env.DASHSCOPE_IMAGE_MODEL || DEFAULT_TEXT2IMAGE_MODEL
  const size = process.env.DASHSCOPE_IMAGE_SIZE || DEFAULT_IMAGE_SIZE

  const body = {
    model,
    input: {
      prompt,
      negative_prompt: negativePrompt,
    },
    parameters: {
      size,
      n: 1,
    },
  }

  const taskId = await createTask(body)
  return pollTask(taskId)
}

export async function editImage(
  baseImageUrl: string,
  prompt: string
): Promise<string> {
  const body = {
    model: 'wanx2.1-imageedit',
    input: {
      function: 'description_edit',
      prompt,
      base_image_url: baseImageUrl,
    },
    parameters: {
      n: 1,
    },
  }

  const taskId = await createTask(body)
  return pollTask(taskId)
}
