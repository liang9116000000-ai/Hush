# PaddleOCR Node.js 服务

基于 `ppu-paddle-ocr` 的高精度中文 OCR 服务

## 安装

```bash
cd ocr-service
npm install
```

## 运行

```bash
npm start
```

服务将在 `http://localhost:5000` 启动

## 配置应用

1. 打开应用设置（左下角）
2. 找到 "DeepSeek OCR 配置"
3. OCR API Base URL 设置为：`http://localhost:5000/api/ocr`
4. OCR API Key 留空
5. 保存设置

## 使用

1. 在应用中选择 "DeepSeek OCR" 模型
2. 点击附件按钮上传图片
3. 等待识别完成

## 特性

- ✅ 高精度中文识别（95%+）
- ✅ 支持中英文混合
- ✅ 支持倾斜、旋转文字
- ✅ 自动方向校正
- ✅ 完全免费开源
- ✅ 基于百度 PaddleOCR

## 注意事项

- 首次运行会自动下载 PaddleOCR 模型（约 10MB）
- 需要 Node.js 16+ 版本
- 支持 JPG、PNG、WEBP 图片格式
- 最大文件大小 10MB

## API 接口

### POST /api/ocr
上传图片进行 OCR 识别

**请求:**
- Content-Type: multipart/form-data
- Body: file (图片文件)

**响应:**
```json
{
  "text": "识别的文字内容",
  "confidence": 0.95,
  "lines": 10
}
```

### GET /api/health
健康检查

**响应:**
```json
{
  "status": "ok",
  "service": "PaddleOCR (ppu-paddle-ocr)",
  "lang": "ch+en"
}
```

