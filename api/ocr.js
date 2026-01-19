// Vercel Serverless Function for OCR
// 由于 Vercel 限制，这里提供一个代理到外部 OCR 服务的实现
// 或者返回提示信息让用户配置自己的 OCR 服务

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Vercel Serverless 环境不适合运行 Tesseract.js
  // 返回友好的错误提示
  return res.status(503).json({ 
    error: { 
      message: '⚠️ Vercel 环境不支持内置 OCR\n\n' +
               '请配置外部 OCR 服务：\n' +
               '1. 部署 PaddleOCR 服务（推荐）\n' +
               '2. 使用百度/腾讯/阿里云 OCR API\n' +
               '3. 在本地运行 OCR 服务\n\n' +
               '配置方法：\n' +
               '- 在设置中填入 OCR API Base URL\n' +
               '- 例如：http://localhost:5000/api/ocr\n\n' +
               '参考文档：OCR-SERVICE-SETUP.md'
    } 
  });
}
