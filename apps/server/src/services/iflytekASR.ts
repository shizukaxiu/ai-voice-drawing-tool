import WebSocket from 'ws'
import crypto from 'crypto'

const HOST = 'iat-api.xfyun.cn'
const URI = '/v2/iat'
const HOST_URL = `wss://${HOST}${URI}`
const FRAME_SIZE = 1280

export interface IFlytekASRConfig {
  appId: string
  apiKey: string
  apiSecret: string
}

interface AsrFrameData {
  status: number
  format: string
  audio: string
  encoding: string
}

function buildAuthUrl(config: IFlytekASRConfig): string {
  const date = new Date().toUTCString()
  const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET ${URI} HTTP/1.1`
  const signature = crypto
    .createHmac('sha256', config.apiSecret)
    .update(signatureOrigin)
    .digest('base64')
  const authorizationOrigin =
    `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')
  const params = new URLSearchParams({ authorization, date, host: HOST })
  return `${HOST_URL}?${params.toString()}`
}

function concatResult(results: (any | null)[]): string {
  return results
    .filter(Boolean)
    .flatMap((r: any) => r.ws)
    .flatMap((w: any) => w.cw)
    .map((c: any) => c.w)
    .join('')
}

export async function transcribeAudio(
  pcmBuffer: Buffer,
  config: IFlytekASRConfig
): Promise<string> {
  if (!config.appId || !config.apiKey || !config.apiSecret) {
    throw new Error('讯飞 ASR 配置缺失，请检查环境变量')
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const url = buildAuthUrl(config)
    const ws = new WebSocket(url)
    const iatResults: (any | null)[] = []
    let lastError: Error | null = null

    const timeout = setTimeout(() => {
      lastError = new Error('ASR 请求超时')
      ws.terminate()
    }, 30000)

    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (lastError) {
        reject(lastError)
      } else {
        resolve(concatResult(iatResults))
      }
    }

    ws.on('open', () => {
      let offset = 0

      const sendNextFrame = () => {
        const isLast = offset + FRAME_SIZE >= pcmBuffer.length
        const chunk = isLast
          ? pcmBuffer.subarray(offset)
          : pcmBuffer.subarray(offset, offset + FRAME_SIZE)
        const frameStatus = offset === 0 ? 0 : isLast ? 2 : 1

        const dataSection: AsrFrameData = {
          status: frameStatus,
          format: 'audio/L16;rate=16000',
          audio: chunk.toString('base64'),
          encoding: 'raw',
        }

        let frame: any
        if (frameStatus === 0) {
          frame = {
            common: { app_id: config.appId },
            business: {
              language: 'zh_cn',
              domain: 'iat',
              accent: 'mandarin',
            },
            data: dataSection,
          }
        } else {
          frame = { data: dataSection }
        }

        ws.send(JSON.stringify(frame))

        if (isLast) {
          return
        }
        offset += FRAME_SIZE
        setImmediate(sendNextFrame)
      }

      sendNextFrame()
    })

    ws.on('message', (data) => {
      const raw = typeof data === 'string' ? data : data.toString()
      let res: any
      try {
        res = JSON.parse(raw)
      } catch {
        lastError = new Error('ASR 返回格式错误')
        ws.close()
        return
      }

      if (res.code !== 0) {
        lastError = new Error(`ASR 错误 (${res.code}): ${res.message}`)
        ws.close()
        return
      }

      if (res.data && res.data.result) {
        const result = res.data.result
        iatResults[result.sn] = result

        if (result.pgs === 'rpl') {
          const [start, end] = result.rg
          for (let i = start; i <= end; i++) {
            iatResults[i] = null
          }
        }
      }

      if (res.data && res.data.status === 2) {
        ws.close()
      }
    })

    ws.on('error', (err) => {
      lastError = err
      ws.terminate()
    })

    ws.on('close', finish)
  })
}
