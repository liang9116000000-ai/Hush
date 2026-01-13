// Vercel Serverless Function for Qwen Image Generation
export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

    // 轮询等待结果（最多 60 次，每次 2 秒）
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
}
