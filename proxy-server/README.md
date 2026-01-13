# Hush AI 代理服务器

这是一个简单的 CORS 代理服务器，用于解决浏览器跨域限制问题。

## 功能

- ✅ DeepSeek API 代理
- ✅ 千问（Qwen）API 代理
- ✅ 千问图像生成 API 代理
- ✅ 支持流式响应
- ✅ CORS 跨域支持

## 安装

```bash
cd proxy-server
npm install
```

## 运行

### 开发模式（自动重启）
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

服务器默认运行在 `http://localhost:3001`

## 配置前端

启动代理服务器后，在 Hush AI 设置中配置：

### DeepSeek 配置
- API Base URL: `http://localhost:3001/api/deepseek`

### 千问配置
- API Base URL: `http://localhost:3001/api/qwen`

### 千问图像配置
- API Base URL: `http://localhost:3001/api/qwen-image`

## API 端点

### 健康检查
```
GET /health
```

### DeepSeek 代理
```
POST /api/deepseek/chat/completions
```

### 千问代理
```
POST /api/qwen/chat/completions
```

### 千问图像生成
```
POST /api/qwen-image/generate
Body: {
  "apiKey": "your-api-key",
  "prompt": "图像描述",
  "negativePrompt": "负面提示（可选）",
  "size": "1024*1024",
  "n": 1
}
```

### 千问图像任务查询
```
GET /api/qwen-image/task/:taskId
Headers: {
  "Authorization": "Bearer your-api-key"
}
```

## 部署到生产环境

### 使用 PM2
```bash
npm install -g pm2
pm2 start server.js --name hush-proxy
pm2 save
pm2 startup
```

### 使用 Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
```

构建并运行：
```bash
docker build -t hush-proxy .
docker run -p 3001:3001 hush-proxy
```

### 环境变量
```bash
PORT=3001  # 服务器端口
```

## 安全建议

⚠️ **生产环境注意事项：**

1. **添加认证**：建议添加 API Key 验证
2. **限流**：使用 express-rate-limit 防止滥用
3. **HTTPS**：使用 SSL 证书加密传输
4. **日志**：添加请求日志记录
5. **监控**：使用 PM2 或其他工具监控服务状态

## 故障排查

### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3001
# 或
netstat -ano | findstr :3001

# 修改端口
PORT=3002 npm start
```

### 连接超时
检查防火墙设置，确保端口开放。

### CORS 错误
确保前端配置的 URL 与代理服务器地址一致。
