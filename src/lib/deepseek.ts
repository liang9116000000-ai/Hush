export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner'

export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

type DeepSeekStreamDelta = {
  id?: string
  choices?: Array<{
    delta?: { content?: string }
    finish_reason?: string | null
  }>
  error?: { message?: string }
}

export class DeepSeekError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'DeepSeekError'
    this.status = status
    this.payload = payload
  }
}

export const DEFAULT_API_BASE = 'https://api.deepseek.com/v1'

export async function createDeepSeekChatCompletion(opts: {
  apiKey: string
  apiBase?: string
  model: DeepSeekModel
  messages: ChatMessage[]
  temperature?: number
  signal?: AbortSignal
}): Promise<string> {
  const baseUrl = opts.apiBase || DEFAULT_API_BASE
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      stream: false,
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
    throw new DeepSeekError(`DeepSeek 请求失败 (${res.status})`, res.status, payload)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = json.choices?.[0]?.message?.content ?? ''
  return content
}

export async function* streamDeepSeekChatCompletion(opts: {
  apiKey: string
  apiBase?: string
  model: DeepSeekModel
  messages: ChatMessage[]
  temperature?: number
  signal?: AbortSignal
}): AsyncGenerator<string, void, void> {
  const baseUrl = opts.apiBase || DEFAULT_API_BASE
  const res = await fetch(`${baseUrl}/chat/completions`, {
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
    throw new DeepSeekError(`DeepSeek 请求失败 (${res.status})`, res.status, payload)
  }

  if (!res.body) {
    throw new DeepSeekError('DeepSeek 流式响应不可用')
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

      let parsed: DeepSeekStreamDelta | null = null
      try {
        parsed = JSON.parse(data) as DeepSeekStreamDelta
      } catch {
        parsed = null
      }

      const errMsg = parsed?.error?.message
      if (errMsg) {
        throw new DeepSeekError(errMsg)
      }

      const delta = parsed?.choices?.[0]?.delta?.content
      if (delta) yield delta
    }
  }
}
