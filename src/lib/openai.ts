export type OpenAIModel = 'gpt-5.2' | 'gpt-4o' | 'gpt-4o-image' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo'

export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

type OpenAIStreamDelta = {
  id?: string
  choices?: Array<{
    delta?: { content?: string }
    finish_reason?: string | null
  }>
  error?: { message?: string }
}

export class OpenAIError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'OpenAIError'
    this.status = status
    this.payload = payload
  }
}

const getOpenAIApiBase = () => {
  if (typeof window === 'undefined') return 'https://us.getgoapi.com/v1'
  
  // 生产环境：使用同域名的 /api
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/api/openai`
  }
  
  // 开发环境：使用本地后端
  return 'http://localhost:3000/api/openai'
}

export const DEFAULT_OPENAI_API_BASE = getOpenAIApiBase()

export async function* streamOpenAIChatCompletion(opts: {
  apiKey: string
  apiBase?: string
  model: OpenAIModel
  messages: ChatMessage[]
  temperature?: number
  signal?: AbortSignal
}): AsyncGenerator<string, void, void> {
  const baseUrl = opts.apiBase || DEFAULT_OPENAI_API_BASE
  const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      stream: true,
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
    throw new OpenAIError(`ChatGPT请求失败 (${res.status})`, res.status, payload)
  }

  if (!res.body) {
    throw new OpenAIError('ChatGPT流式响应不可用')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  const reader = res.body.getReader()

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) buffer += decoder.decode(value, { stream: true })

    while (true) {
      const newlineIndex = buffer.indexOf('\n')
      if (newlineIndex === -1) break

      const rawLine = buffer.slice(0, newlineIndex).trimEnd()
      buffer = buffer.slice(newlineIndex + 1)

      const line = rawLine.trim()
      if (!line) continue
      if (!line.startsWith('data:')) continue

      const data = line.slice('data:'.length).trim()
      if (!data) continue
      if (data === '[DONE]') return

      let parsed: OpenAIStreamDelta | null = null
      try {
        parsed = JSON.parse(data) as OpenAIStreamDelta
      } catch {
        parsed = null
      }

      const errMsg = parsed?.error?.message
      if (errMsg) {
        throw new OpenAIError(errMsg)
      }

      const delta = parsed?.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }
}
