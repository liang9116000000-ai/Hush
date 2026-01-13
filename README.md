# Hush AI

一个现代化的 AI 聊天应用，支持多个 AI 模型和图像生成。

## 功能特性

- ✅ 支持 DeepSeek Chat 和 DeepSeek R1 模型
- ✅ 支持通义千问（Qwen Turbo/Plus/Max）
- ✅ 支持通义千问图像生成（Wanx-v1）
- ✅ 流式响应，实时显示
- ✅ 多会话管理
- ✅ IndexedDB 本地存储
- ✅ 独立配置每个模型的 API Key 和 Base URL
- ✅ 响应式设计

## 快速开始

### 前端应用

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 代理服务器（解决 CORS 问题）

由于浏览器的 CORS 限制，图像生成功能需要通过代理服务器访问。

```bash
# 进入代理服务器目录
cd proxy-server

# 安装依赖
npm install

# 启动代理服务器
npm start

# 或使用开发模式（自动重启）
npm run dev
```

代理服务器默认运行在 `http://localhost:3001`

## 配置

1. 打开应用，点击左下角设置按钮
2. 配置各个模型的 API Key 和 Base URL

### 使用代理服务器

启动代理服务器后，在设置中配置：

- **DeepSeek Chat**: `http://localhost:3001/api/deepseek`
- **DeepSeek Reasoner**: `http://localhost:3001/api/deepseek`
- **千问**: `http://localhost:3001/api/qwen`
- **千问图像**: `http://localhost:3001/api/qwen-image`

### 直接使用官方 API

如果不使用代理服务器（可能遇到 CORS 问题）：

- **DeepSeek**: `https://api.deepseek.com/v1`
- **千问**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **千问图像**: `https://dashscope.aliyuncs.com/api/v1`

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **状态管理**: React Hooks
- **存储**: IndexedDB
- **代理服务器**: Node.js + Express
- **样式**: 原生 CSS

## 项目结构

```
.
├── src/
│   ├── lib/
│   │   ├── deepseek.ts      # DeepSeek API
│   │   ├── qwen.ts          # 千问 API
│   │   ├── qwen-image.ts    # 千问图像 API
│   │   └── db.ts            # IndexedDB 封装
│   ├── App.tsx              # 主应用组件
│   ├── index.css            # 全局样式
│   └── main.tsx             # 入口文件
├── proxy-server/
│   ├── server.js            # 代理服务器
│   ├── package.json
│   └── README.md
├── public/
│   └── AI.png               # Logo
└── README.md
```

## 部署

### 前端部署

```bash
npm run build
```

将 `dist` 目录部署到任何静态托管服务（Vercel、Netlify、GitHub Pages 等）。

### 代理服务器部署

参考 `proxy-server/README.md` 了解详细的部署方法。

推荐使用 PM2 或 Docker 部署到生产环境。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在另一个终端启动代理服务器
cd proxy-server
npm install
npm run dev
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
