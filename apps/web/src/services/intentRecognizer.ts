/**
 * 本地语音意图识别
 * 将用户口语化的控制指令映射到前端操作，避免所有操作都走 LLM。
 */

export type VoiceIntent =
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'regenerate' }
  | { type: 'new_chat' }
  | { type: 'save_image' }
  | { type: 'continue_modify' }
  | { type: 'unknown'; text: string }

interface CommandPattern {
  intent: VoiceIntent['type']
  coreKeywords: string[]
  oralKeywords: string[]
  excludeKeywords: string[]
  regex: RegExp[]
  minScore: number
}

/**
 * 命令模式表：覆盖正式说法与口语化表达。
 * 评分规则：核心词 +2，口语词 +1，正则 +1.5，排除词直接过滤。
 */
const COMMAND_PATTERNS: CommandPattern[] = [
  {
    intent: 'stop',
    coreKeywords: ['停止', '暂停', '结束', '停'],
    oralKeywords: [
      '别说了',
      '别讲了',
      '先这样',
      '可以了',
      '够了',
      '不要了',
      '到此为止',
      '闭嘴',
      '我不说了',
      '先停一下',
      '等一下',
      '歇会儿',
      '不说了',
      '停下来',
      '停一下',
      '不用了',
      '算了',
      '收',
    ],
    excludeKeywords: ['不要停', '别停', '继续', '别停止', '不要暂停', '别结束'],
    regex: [
      /^停[止一下]?$/,
      /别[说讲]了/,
      /到此为[止住]/,
      /先停[一下]?/,
      /[停收][一下]?$/,
    ],
    minScore: 2,
  },
  {
    intent: 'start',
    coreKeywords: ['开始', '继续', '说'],
    oralKeywords: [
      '我准备好了',
      '说吧',
      '开始吧',
      '继续吧',
      '听着呢',
      '我开始了',
      '来吧',
      '搞起来',
      '开始录音',
      '继续录音',
      '说',
      '讲',
    ],
    excludeKeywords: ['不要开始', '别开始', '停止', '暂停', '别继续'],
    regex: [/^[开始继续][吧]?$/, /我准备好/, /开始[录音]?/, /继续[录音]?/],
    minScore: 2,
  },
  {
    intent: 'regenerate',
    coreKeywords: ['重画', '重新画', '再来', '换一张'],
    oralKeywords: [
      '画得不好',
      '这不对',
      '不太像',
      '重新生成',
      '换一个',
      '再来一次',
      '重画一张',
      '重新来',
      '不满意',
      '效果不好',
      '画错了',
      '再来一张',
      '重画吧',
      '重新画一张',
      '换一张吧',
      '重新生成一张',
    ],
    excludeKeywords: ['不要重画', '不用换', '别重画', '不用重新'],
    regex: [/^[重新]?画[一下]?$/, /再来[一张]?/, /换[一]?张/, /重新[画来]/],
    minScore: 2,
  },
  {
    intent: 'new_chat',
    coreKeywords: ['新对话', '重新开始', '重置', '清空'],
    oralKeywords: [
      '从头来',
      '忘掉刚才的',
      '重新聊',
      '新的',
      '清除',
      '清空对话',
      '重来',
      '换话题',
      '新话题',
      '重新开始吧',
      '清空吧',
      '忘了刚才',
      '新开始',
    ],
    excludeKeywords: ['不要清空', '别重置', '不清空', '不要新对话'],
    regex: [/新[的对]?话/, /重新[开始来]/, /清空/, /重置/, /重来/],
    minScore: 2,
  },
  {
    intent: 'save_image',
    coreKeywords: ['保存', '下载', '存'],
    oralKeywords: [
      '存下来',
      '发给我',
      '我要这张图',
      '保存图片',
      '下载图片',
      '保留',
      '留下来',
      '存到本地',
      '保存一下',
      '下载一下',
      '存起来',
      '我要这个',
      '发我',
    ],
    excludeKeywords: ['不要保存', '别保存', '不要下载', '别下载', '不用存'],
    regex: [/保存[图片]?/, /下载[图片]?/, /存[到下来]?/],
    minScore: 2,
  },
  {
    intent: 'continue_modify',
    coreKeywords: ['修改', '改', '调整'],
    oralKeywords: [
      '改一下',
      '调整一下',
      '换个风格',
      '加点东西',
      '改改',
      '再修一下',
      '修一下',
      '微调',
      '改改看',
      '改一下这个',
      '调整调整',
      '修一修',
      '改动一下',
    ],
    excludeKeywords: ['不要改', '别改', '不用改'],
    regex: [/改[一下改]?/, /调整[一下]?/, /修[一下]?/, /换[个种]?风格/],
    minScore: 2,
  },
]

const CONNECTIVE_SEPARATORS = /然后|接着|再|之后|随后|而且|并且|，|；|;|\n/

/** 语气词与无意义前缀，识别前先剥离 */
const STOP_WORDS = /(帮我|请|一下|把|这个|那张|那个|给我|为我|我想|我要|你|一下|一个|帮我一下)/g

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(STOP_WORDS, '')
    .replace(/[.,;!?，。！？、；\s]+/g, '')
    .trim()
}

function recognizeSingleIntent(normalized: string): VoiceIntent {
  let best: { intent: VoiceIntent['type']; score: number } | null = null

  for (const pattern of COMMAND_PATTERNS) {
    // 排除词直接过滤
    if (pattern.excludeKeywords.some((k) => normalized.includes(k))) {
      continue
    }

    let score = 0

    for (const kw of pattern.coreKeywords) {
      if (normalized.includes(kw)) score += 2
    }

    for (const kw of pattern.oralKeywords) {
      if (normalized.includes(kw)) score += 1
    }

    for (const re of pattern.regex) {
      if (re.test(normalized)) score += 1.5
    }

    if (score >= pattern.minScore && (!best || score > best.score)) {
      best = { intent: pattern.intent, score }
    }
  }

  if (best) {
    return { type: best.intent } as VoiceIntent
  }

  return { type: 'unknown', text: normalized }
}

/**
 * 识别用户语音中的命令意图。
 * 优先整体识别；若整体不是命令，再尝试按连接词拆分为连续命令。
 * 只要有一个片段不是命令，就视为普通输入走 LLM 流程。
 */
export function recognizeIntents(text: string): VoiceIntent[] {
  if (!text || !text.trim()) {
    return [{ type: 'unknown', text: '' }]
  }

  const normalized = normalizeText(text)
  if (!normalized) {
    return [{ type: 'unknown', text }]
  }

  // 1. 尝试整体识别
  const whole = recognizeSingleIntent(normalized)
  if (whole.type !== 'unknown') {
    // 对较长的句子做保守判断：如果文本较长且只命中简单命令，
    // 优先交给 LLM 理解，避免把创作描述中的词汇误识别为命令。
    const simpleCommands: VoiceIntent['type'][] = [
      'stop',
      'start',
      'save_image',
      'new_chat',
    ]
    if (normalized.length > 12 && simpleCommands.includes(whole.type)) {
      return [{ type: 'unknown', text }]
    }
    return [whole]
  }

  // 2. 尝试拆分连续命令
  const parts = text
    .split(CONNECTIVE_SEPARATORS)
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length > 1) {
    const intents: VoiceIntent[] = []
    for (const part of parts) {
      const intent = recognizeSingleIntent(normalizeText(part))
      if (intent.type === 'unknown') {
        // 任一片段不是命令，则整体作为普通输入
        return [{ type: 'unknown', text }]
      }
      intents.push(intent)
    }
    return intents
  }

  return [{ type: 'unknown', text }]
}
