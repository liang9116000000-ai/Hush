export class OpenAIImageError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'OpenAIImageError'
    this.status = status
    this.payload = payload
  }
}

const getOpenAIImageApiBase = () => {
  if (typeof window === 'undefined') return 'https://us.getgoapi.com/v1'
  
  // 生产环境：使用同域名的 /api
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/api/openai-image`
  }
  
  // 开发环境：使用本地后端
  return 'http://localhost:3000/api/openai-image'
}

export const DEFAULT_OPENAI_IMAGE_API_BASE = getOpenAIImageApiBase()

export type OpenAIImageModel = 'gpt-4o-image' | 'dall-e-3' | 'dall-e-2'

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792' | '512x512' | '256x256'

type ImageResponse = {
  created?: number
  data?: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

export async function generateOpenAIImage(opts: {
  apiKey: string
  apiBase?: string
  model?: OpenAIImageModel
  prompt: string
  size?: ImageSize
  n?: number
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  signal?: AbortSignal
  onProgress?: (status: string) => void
}): Promise<string[]> {
  const baseUrl = opts.apiBase || DEFAULT_OPENAI_IMAGE_API_BASE
  const url = baseUrl.endsWith('/generate') ? baseUrl : `${baseUrl}/generate`
  
  opts.onProgress?.('正在生成图像...')
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model || 'gpt-4o-image',
        prompt: opts.prompt,
        size: opts.size || '1024x1024',
        n: opts.n || 1,
        quality: opts.quality || 'standard',
        style: opts.style || 'vivid',
      }),
      signal: opts.signal,
    })

    if (!res.ok) {
      let payload: unknown = undefined
      try {
        payload = await res.json()
      } catch {
        payload = await res.text().catch(() => undefined)
      }
      const errorMsg = (payload as any)?.error?.message || `图像生成请求失败 (${res.status})`
      throw new OpenAIImageError(errorMsg, res.status, payload)
    }

    const json = (await res.json()) as ImageResponse
    
    if (json.error) {
      throw new OpenAIImageError(json.error.message || '图像生成失败')
    }

    const urls = json.data?.map(d => d.url).filter((u): u is string => !!u) || []
    
    if (urls.length === 0) {
      throw new OpenAIImageError('未获取到生成的图像')
    }
    
    return urls
  } catch (err) {
    if (err instanceof OpenAIImageError) throw err
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new OpenAIImageError('无法连接到 API 服务器')
    }
    throw new OpenAIImageError(err instanceof Error ? err.message : '请求失败')
  }
}
