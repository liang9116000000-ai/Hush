export class QwenImageError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'QwenImageError'
    this.status = status
    this.payload = payload
  }
}

export const DEFAULT_QWEN_IMAGE_API_BASE = 'https://dashscope.aliyuncs.com/api/v1'

type TaskResponse = {
  output?: {
    task_id?: string
    task_status?: string
    results?: Array<{ url?: string }>
  }
  request_id?: string
  code?: string
  message?: string
}

// 提交图像生成任务
async function submitImageTask(opts: {
  apiKey: string
  apiBase?: string
  prompt: string
  negativePrompt?: string
  size?: string
  n?: number
  signal?: AbortSignal
}): Promise<string> {
  const baseUrl = opts.apiBase || DEFAULT_QWEN_IMAGE_API_BASE
  
  try {
    const res = await fetch(`${baseUrl}/services/aigc/text2image/image-synthesis`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        input: {
          prompt: opts.prompt,
          negative_prompt: opts.negativePrompt || '',
        },
        parameters: {
          size: opts.size || '1024*1024',
          n: opts.n || 1,
        },
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
      throw new QwenImageError(`图像生成请求失败 (${res.status})`, res.status, payload)
    }

    const json = (await res.json()) as TaskResponse
    
    if (json.code) {
      throw new QwenImageError(json.message || '图像生成失败')
    }

    const taskId = json.output?.task_id
    if (!taskId) {
      throw new QwenImageError('未获取到任务ID')
    }

    return taskId
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new QwenImageError(
        '无法连接到阿里云 API。由于浏览器 CORS 限制，图像生成功能需要通过代理服务器访问。\n\n' +
        '解决方案：\n' +
        '1. 在 API Base URL 中配置支持 CORS 的代理地址\n' +
        '2. 或使用浏览器扩展（如 CORS Unblock）临时禁用 CORS\n' +
        '3. 或部署后端服务作为代理'
      )
    }
    throw err
  }
}

// 查询任务状态
async function getTaskResult(opts: {
  apiKey: string
  apiBase?: string
  taskId: string
  signal?: AbortSignal
}): Promise<TaskResponse> {
  const baseUrl = opts.apiBase || DEFAULT_QWEN_IMAGE_API_BASE
  const res = await fetch(`${baseUrl}/tasks/${opts.taskId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
    },
    signal: opts.signal,
  })

  if (!res.ok) {
    let payload: unknown = undefined
    try {
      payload = await res.json()
    } catch {
      payload = await res.text().catch(() => undefined)
    }
    throw new QwenImageError(`查询任务失败 (${res.status})`, res.status, payload)
  }

  return (await res.json()) as TaskResponse
}

// 生成图像（支持代理服务器）
export async function generateImage(opts: {
  apiKey: string
  apiBase?: string
  prompt: string
  negativePrompt?: string
  size?: string
  n?: number
  signal?: AbortSignal
  onProgress?: (status: string) => void
}): Promise<string[]> {
  const baseUrl = opts.apiBase || DEFAULT_QWEN_IMAGE_API_BASE
  
  // 检测是否使用代理服务器
  const isProxy = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || !baseUrl.includes('dashscope.aliyuncs.com')
  
  if (isProxy) {
    // 使用代理服务器的简化接口
    opts.onProgress?.('正在生成图像...')
    
    try {
      const res = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: opts.apiKey,
          prompt: opts.prompt,
          negativePrompt: opts.negativePrompt,
          size: opts.size || '1024*1024',
          n: opts.n || 1,
        }),
        signal: opts.signal,
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: '请求失败' }))
        throw new QwenImageError(error.error || `请求失败 (${res.status})`)
      }
      
      const result = await res.json()
      const urls = result.output?.results?.map((r: any) => r.url).filter((u: any): u is string => !!u) || []
      
      if (urls.length === 0) {
        throw new QwenImageError('未获取到生成的图像')
      }
      
      return urls
    } catch (err) {
      if (err instanceof QwenImageError) throw err
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new QwenImageError('无法连接到代理服务器，请确保代理服务正在运行')
      }
      throw new QwenImageError(err instanceof Error ? err.message : '请求失败')
    }
  }
  
  // 直接调用阿里云 API（可能遇到 CORS 问题）
  opts.onProgress?.('正在提交生成任务...')
  const taskId = await submitImageTask(opts)
  
  // 轮询等待结果
  const maxAttempts = 60
  let attempts = 0
  
  while (attempts < maxAttempts) {
    if (opts.signal?.aborted) {
      throw new QwenImageError('任务已取消')
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const result = await getTaskResult({
      apiKey: opts.apiKey,
      apiBase: opts.apiBase,
      taskId,
      signal: opts.signal,
    })
    
    const status = result.output?.task_status
    
    if (status === 'SUCCEEDED') {
      const urls = result.output?.results?.map(r => r.url).filter((u): u is string => !!u) || []
      if (urls.length === 0) {
        throw new QwenImageError('未获取到生成的图像')
      }
      return urls
    }
    
    if (status === 'FAILED') {
      throw new QwenImageError(result.message || '图像生成失败')
    }
    
    opts.onProgress?.(`正在生成图像... (${status})`)
    attempts++
  }
  
  throw new QwenImageError('图像生成超时')
}
