// Vercel Serverless Function for OCR
import { createWorker } from 'tesseract.js';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60, // 最大执行时间 60 秒
};

async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        
        if (!contentType.includes('multipart/form-data')) {
          reject(new Error('Invalid content type'));
          return;
        }
        
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
          reject(new Error('No boundary found'));
          return;
        }
        
        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('filename=')) {
            const start = part.indexOf('\r\n\r\n') + 4;
            const end = part.lastIndexOf('\r\n');
            if (start > 3 && end > start) {
              const fileData = Buffer.from(part.substring(start, end), 'binary');
              resolve(fileData);
              return;
            }
          }
        }
        reject(new Error('No file found in request'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

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

  let worker = null;

  try {
    console.log('Starting OCR process...');
    
    // 解析文件
    const fileBuffer = await parseMultipartForm(req);
    console.log('File parsed, size:', fileBuffer.length);
    
    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: { message: '文件为空' } });
    }
    
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: { message: '文件大小超过 10MB' } });
    }
    
    // 创建 Tesseract Worker
    console.log('Creating Tesseract worker...');
    worker = await createWorker('chi_sim+eng', 1, {
      logger: m => console.log(m)
    });
    
    // 执行 OCR
    console.log('Recognizing text...');
    const { data: { text, confidence } } = await worker.recognize(fileBuffer);
    console.log('OCR completed, confidence:', confidence);
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: { message: '未识别到文字' } });
    }
    
    return res.status(200).json({ 
      text: text.trim(),
      confidence: confidence
    });
    
  } catch (error) {
    console.error('OCR error:', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || 'OCR 识别失败',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } 
    });
  } finally {
    // 清理 worker
    if (worker) {
      try {
        await worker.terminate();
        console.log('Worker terminated');
      } catch (err) {
        console.error('Error terminating worker:', err);
      }
    }
  }
}
