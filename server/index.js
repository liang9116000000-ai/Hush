import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hush AI Server is running' })
})

// DeepSeek API 代理
app.post('/api/deepseek/chat/completions', async (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' })
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    // 处理流式响应
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(decoder.decode(value, { stream: true }))
        }
      } catch (err) {
        console.error('Stream error:', err)
      } finally {
        res.end()
      }
    } else {
      const data = await response.json()
      res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('DeepSeek API error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 千问 API 代理
app.post('/api/qwen/chat/completions', async (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' })
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    // 处理流式响应
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(decoder.decode(value, { stream: true }))
        }
      } catch (err) {
        console.error('Stream error:', err)
      } finally {
        res.end()
      }
    } else {
      const data = await response.json()
      res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('Qwen API error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GLM API 代理
app.post('/api/glm/chat/completions', async (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' })
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    // 处理流式响应
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(decoder.decode(value, { stream: true }))
        }
      } catch (err) {
        console.error('Stream error:', err)
      } finally {
        res.end()
      }
    } else {
      const data = await response.json()
      res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('GLM API error:', error)
    res.status(500).json({ error: error.message })
  }
})

// OpenAI API 代理
app.post('/api/openai/chat/completions', async (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' })
  }

  try {
    const response = await fetch('https://us.getgoapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    // 处理流式响应
    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(decoder.decode(value, { stream: true }))
        }
      } catch (err) {
        console.error('Stream error:', err)
      } finally {
        res.end()
      }
    } else {
      const data = await response.json()
      res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 千问图像生成 API
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
        return res.status(200).json(resultData)
      }

      if (status === 'FAILED') {
        return res.status(500).json(resultData)
      }

      attempts++
    }

    res.status(408).json({ error: '图像生成超时' })
  } catch (error) {
    console.error('Qwen image error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  
  // SPA 路由处理
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Hush AI Server running on http://localhost:${PORT}`)
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔗 DeepSeek API: http://localhost:${PORT}/api/deepseek/chat/completions`)
  console.log(`🔗 Qwen API: http://localhost:${PORT}/api/qwen/chat/completions`)
  console.log(`🔗 GLM API: http://localhost:${PORT}/api/glm/chat/completions`)
  console.log(`🔗 OpenAI API: http://localhost:${PORT}/api/openai/chat/completions`)
  console.log(`🖼️  Qwen Image API: http://localhost:${PORT}/api/qwen-image/generate`)
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend: http://localhost:${PORT}`)
  }
})
