// Vercel Serverless Function for OCR
import { createWorker } from 'tesseract.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('filename=')) {
            const start = part.indexOf('\r\n\r\n') + 4;
            const end = part.lastIndexOf('\r\n');
            const fileData = Buffer.from(part.substring(start, end), 'binary');
            resolve(fileData);
            return;
          }
        }
        reject(new Error('No file found'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const fileBuffer = await parseMultipartForm(req);
    
    const worker = await createWorker('chi_sim+eng');
    const { data: { text } } = await worker.recognize(fileBuffer);
    await worker.terminate();
    
    return res.status(200).json({ text });
  } catch (error) {
    console.error('OCR error:', error);
    return res.status(500).json({ error: { message: error.message || 'OCR 识别失败' } });
  }
}
