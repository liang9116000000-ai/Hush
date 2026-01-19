export class DeepSeekOCRError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'DeepSeekOCRError'
    this.status = status
    this.payload = payload
  }
}

const getOCRApiBase = () => {
  if (typeof window === 'undefined') return ''
  
  // 在 Vercel 生产环境，返回空（需要用户配置外部 OCR 服务）
  // 在本地开发环境，使用本地 OCR 端点
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Vercel 环境 - 需要用户配置外部 OCR
    return ''
  }
  
  return 'http://localhost:3000/api/ocr'
}

export const DEFAULT_DEEPSEEK_OCR_API_BASE = getOCRApiBase()

type OCRServiceResponse = {
  text?: string
  error?: { message?: string }
}

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: { message?: string }
}

// 调用 OCR 服务（PaddleOCR 或云 OCR）
async function callOCRService(opts: {
  apiBase: string
  apiKey?: string
  file: File
  signal?: AbortSignal
}): Promise<string> {
  const formData = new FormData()
  formData.append('file', opts.file)
  
  const headers: Record<string, string> = {}
  if (opts.apiKey) {
    headers['Authorization'] = `Bearer ${opts.apiKey}`
  }
  
  console.log('OCR 请求 URL:', opts.apiBase)
  console.log('OCR 文件:', opts.file.name, opts.file.type, opts.file.size)
  
  const res = await fetch(opts.apiBase, {
    method: 'POST',
    headers,
    body: formData,
    signal: opts.signal,
  })

  console.log('OCR 响应状态:', res.status)

  if (!res.ok) {
    let payload: unknown = undefined
    try {
      payload = await res.json()
    } catch {
      payload = await res.text().catch(() => undefined)
    }
    console.error('OCR 错误响应:', payload)
    const errorMsg = (payload as any)?.error?.message || `OCR 服务失败 (${res.status})`
    throw new DeepSeekOCRError(errorMsg, res.status, payload)
  }

  const json = (await res.json()) as OCRServiceResponse
  console.log('OCR 响应数据:', json)
  
  if (json.error) {
    throw new DeepSeekOCRError(json.error.message || 'OCR 识别失败')
  }

  const text = json.text
  if (!text) {
    throw new DeepSeekOCRError('未获取到识别结果')
  }
  
  console.log('OCR 识别文本长度:', text.length)
  
  return text
}

// 用 DeepSeek 处理 OCR 文本
async function processWithDeepSeek(opts: {
  apiKey: string
  apiBase: string
  ocrText: string
  fileName: string
  prompt?: string
  signal?: AbortSignal
}): Promise<string> {
  const url = opts.apiBase.endsWith('/chat/completions') 
    ? opts.apiBase 
    : `${opts.apiBase}/chat/completions`
  
  const systemPrompt = opts.prompt || `以下是从文件"${opts.fileName}"中 OCR 识别出的文本，请对其进行纠错、格式化和结构化处理，使其更易读和理解。如果是表格数据，请转换为 Markdown 表格格式。`
  
  const requestBody = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: `${systemPrompt}\n\n识别的文本内容：\n${opts.ocrText}`
      }
    ]
  }
  
  console.log('DeepSeek 请求 URL:', url)
  console.log('DeepSeek 请求体:', JSON.stringify(requestBody, null, 2))
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: opts.signal,
  })

  if (!res.ok) {
    let payload: unknown = undefined
    try {
      payload = await res.json()
    } catch {
      payload = await res.text().catch(() => undefined)
    }
    console.error('DeepSeek 错误响应:', payload)
    const errorMsg = (payload as any)?.error?.message || `DeepSeek 处理失败 (${res.status})`
    throw new DeepSeekOCRError(errorMsg, res.status, payload)
  }

  const json = (await res.json()) as DeepSeekResponse
  
  if (json.error) {
    throw new DeepSeekOCRError(json.error.message || 'DeepSeek 处理失败')
  }

  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new DeepSeekOCRError('未获取到处理结果')
  }
  
  return content
}

export async function performOCR(opts: {
  apiKey: string
  apiBase?: string
  ocrApiBase?: string
  ocrApiKey?: string
  file: File
  prompt?: string
  signal?: AbortSignal
  onProgress?: (status: string) => void
}): Promise<string> {
  const deepseekBase = opts.apiBase || 'https://api.deepseek.com/v1'
  const ocrBase = opts.ocrApiBase?.trim() || DEFAULT_DEEPSEEK_OCR_API_BASE
  
  // 如果没有配置 OCR 服务，返回友好提示
  if (!ocrBase) {
    const isProduction = typeof window !== 'undefined' && 
                        window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1'
    
    if (isProduction) {
      throw new DeepSeekOCRError(
        '⚠️ 需要配置 OCR 服务\n\n' +
        'Vercel 环境不支持内置 OCR，请配置外部 OCR 服务：\n\n' +
        '方案 1：部署 PaddleOCR 服务（推荐）\n' +
        '  - 参考 paddle-ocr-service/server.py\n' +
        '  - 运行：python server.py\n' +
        '  - 配置：http://your-server:5000/api/ocr\n\n' +
        '方案 2：使用云 OCR API\n' +
        '  - 百度 OCR、腾讯 OCR、阿里云 OCR\n' +
        '  - 创建代理服务转发请求\n\n' +
        '方案 3：本地开发\n' +
        '  - 运行本地服务器\n' +
        '  - 配置：http://localhost:3000/api/ocr\n\n' +
        '详细文档：OCR-SERVICE-SETUP.md'
      )
    } else {
      throw new DeepSeekOCRError(
        '请先配置 OCR API Base URL。\n\n' +
        '本地开发：使用内置 OCR 服务\n' +
        '- 确保主服务器正在运行（npm start）\n' +
        '- OCR API Base URL 留空或填：http://localhost:3000/api/ocr\n\n' +
        '生产环境：需要外部 OCR 服务\n' +
        '- 参考文档：OCR-SERVICE-SETUP.md'
      )
    }
  }
  
  try {
    // 第一步：OCR 识别文字
    opts.onProgress?.('正在识别图片/PDF 中的文字...')
    const ocrText = await callOCRService({
      apiBase: ocrBase,
      apiKey: opts.ocrApiKey,
      file: opts.file,
      signal: opts.signal,
    })
    
    // 第二步：DeepSeek 纠错和结构化
    opts.onProgress?.('正在用 DeepSeek 处理识别结果...')
    const result = await processWithDeepSeek({
      apiKey: opts.apiKey,
      apiBase: deepseekBase,
      ocrText,
      fileName: opts.file.name,
      prompt: opts.prompt,
      signal: opts.signal,
    })
    
    return result
  } catch (err) {
    if (err instanceof DeepSeekOCRError) throw err
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new DeepSeekOCRError('无法连接到 OCR 服务器，请检查 OCR API Base URL 配置')
    }
    throw new DeepSeekOCRError(err instanceof Error ? err.message : '请求失败')
  }
}
