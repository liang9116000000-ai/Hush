# 全栈部署指南

本项目是一个完整的全栈应用，前端（React）和后端（Express）可以一起部署。

## 项目结构

```
.
├── src/              # 前端源码
├── server/           # 后端源码
├── dist/             # 前端构建产物（自动生成）
├── package.json      # 前端依赖
└── server/package.json  # 后端依赖
```

## 本地开发

### 方式 1：同时运行前后端（推荐）

```bash
# 安装所有依赖
npm run install:all

# 同时启动前端和后端
npm run dev:all
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000

### 方式 2：分别运行

```bash
# 终端 1：启动前端
npm run dev

# 终端 2：启动后端
npm run dev:server
```

## 生产部署

### 方式 1：Docker 部署（推荐）

```bash
# 构建镜像
docker build -t hush-ai .

# 运行容器
docker run -p 3000:3000 hush-ai

# 或使用 docker-compose
docker-compose up -d
```

访问：http://localhost:3000

### 方式 2：传统部署

```bash
# 1. 构建前端和后端
npm run build:all

# 2. 启动服务器
npm start
```

访问：http://localhost:3000

### 方式 3：云平台部署

#### Render.com（推荐，免费）

1. 连接 GitHub 仓库
2. 选择 "Web Service"
3. 配置：
   - **Build Command**: `npm run build:all`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. 点击 "Create Web Service"

#### Railway.app

1. 连接 GitHub 仓库
2. 自动检测 Node.js 项目
3. 配置环境变量（如需要）
4. 自动部署

#### Heroku

```bash
# 安装 Heroku CLI
heroku login

# 创建应用
heroku create your-app-name

# 推送代码
git push heroku main

# 打开应用
heroku open
```

#### VPS 部署（Ubuntu）

```bash
# 1. 连接服务器
ssh user@your-server-ip

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 克隆代码
git clone <your-repo-url>
cd hush-ai

# 4. 安装依赖并构建
npm run install:all
npm run build:all

# 5. 使用 PM2 运行
sudo npm install -g pm2
pm2 start server/index.js --name hush-ai
pm2 save
pm2 startup

# 6. 配置 Nginx 反向代理（可选）
sudo apt install nginx
sudo nano /etc/nginx/sites-available/hush-ai
```

Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Docker Compose 部署

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

## 环境变量

在 `server/.env` 中配置：

```env
PORT=3000
NODE_ENV=production
```

## 端口配置

- 默认端口：3000
- 修改端口：设置环境变量 `PORT=8080`

## 健康检查

```bash
curl http://localhost:3000/api/health
```

响应：
```json
{
  "status": "ok",
  "message": "Hush AI Server is running"
}
```

## API 端点

部署后可用的端点：

- `GET /api/health` - 健康检查
- `POST /api/deepseek/chat/completions` - DeepSeek API
- `POST /api/qwen/chat/completions` - 千问 API
- `POST /api/qwen-image/generate` - 千问图像生成

## 性能优化

1. **启用 Gzip 压缩**（已在 Express 中配置）
2. **使用 CDN** 加速静态资源
3. **配置缓存** 策略
4. **使用 PM2** 集群模式：
   ```bash
   pm2 start server/index.js -i max
   ```

## 监控

使用 PM2 监控：
```bash
pm2 monit
pm2 logs hush-ai
pm2 status
```

## 故障排查

### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000
# 或
netstat -ano | findstr :3000

# 杀死进程
kill -9 <PID>
```

### 构建失败
```bash
# 清理缓存
rm -rf node_modules dist server/node_modules
npm run install:all
npm run build:all
```

### API 调用失败
- 检查后端日志
- 确认 API Key 配置正确
- 检查网络连接

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
npm run build:all

# 重启服务
pm2 restart hush-ai
# 或
docker-compose restart
```

## 备份

定期备份 IndexedDB 数据（浏览器本地存储）。

## 安全建议

1. **使用 HTTPS**（配置 SSL 证书）
2. **设置防火墙** 规则
3. **定期更新** 依赖包
4. **限制 API 请求** 频率
5. **不要提交** `.env` 文件到 Git

## 成本估算

- **Render.com 免费版**：0 元/月（有限制）
- **Railway.app**：$5/月起
- **VPS（Vultr/DigitalOcean）**：$5-10/月
- **Heroku**：$7/月起

## 技术支持

遇到问题？
1. 查看日志：`pm2 logs` 或 `docker logs`
2. 检查健康检查端点
3. 查看浏览器控制台错误
