# Hush AI

一个现代化的全栈 AI 聊天应用，支持多个 AI 模型和图像生成。

## 功能特性

- ✅ 支持 DeepSeek Chat 和 DeepSeek R1 模型
- ✅ 支持通义千问（Qwen Turbo/Plus/Max）
- ✅ 支持通义千问图像生成（Wanx-v1）
- ✅ 流式响应，实时显示
- ✅ 多会话管理
- ✅ IndexedDB 本地存储
- ✅ 独立配置每个模型的 API Key
- ✅ 响应式设计
- ✅ 前后端一体化部署

## 快速开始

### 本地开发

```bash
# 安装所有依赖（前端 + 后端）
npm run install:all

# 同时启动前端和后端
npm run dev:all
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000

### 生产部署

#### Docker 部署（推荐）

```bash
# 构建并运行
docker-compose up -d

# 访问应用
open http://localhost:3000
```

#### 传统部署

```bash
# 构建
npm run build:all

# 启动
npm start

# 访问应用
open http://localhost:3000
```

## 项目结构

```
.
├── src/                    # 前端源码（React + TypeScript）
│   ├── lib/               # API 封装
│   ├── App.tsx            # 主应用
│   └── index.css          # 样式
├── server/                # 后端源码（Express）
│   ├── index.js           # 服务器入口
│   └── package.json       # 后端依赖
├── dist/                  # 前端构建产物
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
└── package.json           # 前端依赖
```

## 部署选项

### 1. Docker（推荐）
- 一键部署，环境隔离
- 详见 `DEPLOY-FULLSTACK.md`

### 2. 云平台
- **Render.com**（免费）
- **Railway.app**（$5/月起）
- **Heroku**（$7/月起）

### 3. VPS
- Ubuntu/CentOS 服务器
- 使用 PM2 管理进程
- Nginx 反向代理

详细部署指南：[DEPLOY-FULLSTACK.md](./DEPLOY-FULLSTACK.md)

## 配置

1. 打开应用
2. 点击左下角设置按钮
3. 配置各个模型的 API Key

API Base URL 会自动配置：
- 开发环境：`http://localhost:3000/api/*`
- 生产环境：`https://your-domain.com/api/*`

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 构建工具
- IndexedDB 存储

### 后端
- Node.js + Express
- CORS 代理
- 流式响应支持

## 开发脚本

```bash
# 前端开发
npm run dev

# 后端开发
npm run dev:server

# 同时开发
npm run dev:all

# 构建前端
npm run build

# 构建全部
npm run build:all

# 启动生产服务器
npm start

# 安装所有依赖
npm run install:all
```

## API 端点

- `GET /api/health` - 健康检查
- `POST /api/deepseek/chat/completions` - DeepSeek API
- `POST /api/qwen/chat/completions` - 千问 API
- `POST /api/qwen-image/generate` - 千问图像生成

## 环境变量

在 `server/.env` 中配置：

```env
PORT=3000
NODE_ENV=production
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
