import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'

/**
 * 将任意音频文件转换为讯飞 ASR 所需的 PCM 格式：
 * 采样率 16kHz、位长 16bit、单声道、原始 PCM（s16le）。
 */
export async function convertToPcm(inputPath: string): Promise<Buffer> {
  if (!ffmpegPath) {
    throw new Error('ffmpeg 二进制文件未找到，请检查 ffmpeg-static 安装')
  }

  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-i', inputPath,
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    '-f', 's16le',
    '-',
  ])

  const chunks: Buffer[] = []
  let errMsg = ''

  ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
  ffmpeg.stderr.on('data', (chunk: Buffer) => {
    errMsg += chunk.toString()
  })

  return new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg 转换失败 (exit ${code}): ${errMsg.trim()}`))
        return
      }
      resolve(Buffer.concat(chunks))
    })
    ffmpeg.on('error', (err) => reject(err))
  })
}
