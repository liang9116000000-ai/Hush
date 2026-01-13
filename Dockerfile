# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
RUN npm install

# 复制前端源码并构建
COPY . .
RUN npm run build

# 安装后端依赖
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

WORKDIR /app/server

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动服务
CMD ["node", "index.js"]
