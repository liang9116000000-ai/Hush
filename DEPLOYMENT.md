# 部署指南

## Vercel 部署（推荐）

### 前提条件
- GitHub 账号
- Vercel 账号（可用 GitHub 登录）

### 部署步骤

1. **推送代码到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库
   - 点击 "Deploy"

3. **配置完成**
   - Vercel 会自动检测 Vite 项目
   - 自动部署前端和 Serverless Functions
   - 部署完成后会得到一个 URL，例如：`https://your-app.vercel.app`

### 自动配置

应用会自动检测运行环境：
- **生产环境**：使用 Vercel Serverless Functions（`/api/*`）
- **本地开发**：使用本地代理服务器（`http://localhost:3001`）

### API 端点

部署后，以下端点自动可用：

- **DeepSeek API**: `https://your-app.vercel.app/api/deepseek/chat/completions`
- **千问 API**: `https://your-app.vercel.app/api/qwen/chat/completions`
- **千问图像**: `https://your-app.vercel.app/api/qwen-image/generate`

### 配置 API Key

1. 打开部署的应用
2. 点击左下角设置
3. 输入各个模型的 API Key
4. API Base URL 会自动设置为正确的值

## 本地开发

### 前端开发
```bash
npm install
npm run dev
```

### 代理服务器（可选）
```bash
cd proxy-server
npm install
npm start
```

本地开发时，如果不启动代理服务器，会直接调用官方 API（可能遇到 CORS 问题）。

## 其他部署平台

### Netlify

1. 创建 `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

2. 将 `api/` 目录重命名为 `netlify/functions/`

### Cloudflare Pages

1. 构建命令：`npm run build`
2. 输出目录：`dist`
3. 使用 Cloudflare Workers 处理 API 请求

## 环境变量

如需配置环境变量，在 Vercel 项目设置中添加：

- `NODE_ENV`: `production`
- 其他自定义变量...

## 故障排查

### API 调用失败
- 检查 Vercel Functions 日志
- 确认 API Key 配置正确
- 检查网络连接

### 图像生成超时
- Vercel Functions 默认超时 10 秒
- 已配置为 120 秒（`vercel.json`）
- 如仍超时，考虑优化或使用其他平台

### CORS 错误
- Vercel Functions 已配置 CORS
- 检查请求头是否正确
- 查看浏览器控制台详细错误

## 性能优化

1. **启用缓存**：Vercel 自动缓存静态资源
2. **CDN 加速**：全球 CDN 自动启用
3. **图片优化**：使用 Vercel Image Optimization
4. **代码分割**：Vite 自动处理

## 监控

- Vercel Dashboard 查看部署状态
- Analytics 查看访问统计
- Logs 查看 Functions 日志

## 成本

- **Hobby 计划**：免费
  - 100GB 带宽/月
  - Serverless Functions 执行时间限制
  
- **Pro 计划**：$20/月
  - 1TB 带宽/月
  - 更长的 Functions 执行时间
  - 更多并发请求

## 安全建议

1. **不要提交 API Key** 到代码仓库
2. **使用环境变量** 存储敏感信息
3. **启用 HTTPS**（Vercel 自动启用）
4. **定期更新依赖** 修复安全漏洞
