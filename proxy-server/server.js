import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = process.env.PORT || 3001

// 启用 CORS
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hush AI Proxy Server is running' })
})

// DeepSeek API 代理
app.all('/api/deepseek/*', async (req, res) => {
  const path = req.params[0]
  const url = `https://api.deepseek.com/v1/${path}`
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    // 处理流式响应
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      response.body.pipe(res)
    } else {
      const data = await response.text()
      res.status(response.status).send(data)
    }
  } catch (error) {
    console.error('DeepSeek proxy error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 千问 API 代理
app.all('/api/qwen/*', async (req, res) => {
  const path = req.params[0]
  const url = `https://dashscope.aliyuncs.com/compatible-mode/v1/${path}`
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    // 处理流式响应
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      response.body.pipe(res)
    } else {
      const data = await response.text()
      res.status(response.status).send(data)
    }
  } catch (error) {
    console.error('Qwen proxy error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 千问图像生成 API 代理
app.post('/api/qwen-image/generate', async (req, res) => {
  const { apiKey, prompt, negativePrompt, size, n } = req.body
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' })
  }

  try {
    // 提交任务
    const submitResponse = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: {
            prompt: prompt,
            negative_prompt: negativePrompt || '',
          },
          parameters: {
            size: size || '1024*1024',
            n: n || 1,
          },
        }),
      }
    )

    const submitData = await submitResponse.json()
    
    if (!submitResponse.ok) {
      return res.status(submitResponse.status).json(submitData)
    }

    const taskId = submitData.output?.task_id
    if (!taskId) {
      return res.status(500).json({ error: '未获取到任务ID' })
    }

    // 轮询等待结果
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const resultResponse = await fetch(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      )

      const resultData = await resultResponse.json()
      const status = resultData.output?.task_status

      if (status === 'SUCCEEDED') {
        return res.json(resultData)
      }

      if (status === 'FAILED') {
        return res.status(500).json(resultData)
      }

      attempts++
    }

    res.status(408).json({ error: '图像生成超时' })
  } catch (error) {
    console.error('Qwen image proxy error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 千问图像任务查询代理
app.get('/api/qwen-image/task/:taskId', async (req, res) => {
  const { taskId } = req.params
  const apiKey = req.headers.authorization?.replace('Bearer ', '')
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' })
  }

  try {
    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Qwen image task query error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Hush AI Proxy Server running on http://localhost:${PORT}`)
  console.log(`📝 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 DeepSeek API: http://localhost:${PORT}/api/deepseek/*`)
  console.log(`🔗 Qwen API: http://localhost:${PORT}/api/qwen/*`)
  console.log(`🖼️  Qwen Image API: http://localhost:${PORT}/api/qwen-image/generate`)
})
