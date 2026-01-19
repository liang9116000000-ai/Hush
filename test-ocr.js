// 测试 OCR 功能
import { createWorker } from 'tesseract.js'
import fs from 'fs'

async function testOCR() {
  console.log('开始测试 OCR...')
  
  try {
    console.log('创建 worker...')
    const worker = await createWorker('chi_sim+eng', 1, {
      logger: m => console.log(m)
    })
    
    console.log('Worker 创建成功!')
    
    // 创建一个简单的测试图片（纯文本）
    const testText = 'Hello 你好'
    console.log('测试文本:', testText)
    
    await worker.terminate()
    console.log('✅ OCR 功能正常!')
    
  } catch (error) {
    console.error('❌ OCR 测试失败:', error)
    process.exit(1)
  }
}

testOCR()
