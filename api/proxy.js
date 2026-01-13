// Vercel Serverless Function
export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { path, method = 'POST', headers = {}, body } = req.body

  if (!path) {
    return res.status(400).json({ error: 'Path is required' })
  }

  try {
    const response = await fetch(path, {
      method,
      headers: {
        'Authorization': headers.authorization || '',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })

    const data = await response.text()
    
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    res.status(response.status).send(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: error.message })
  }
}
