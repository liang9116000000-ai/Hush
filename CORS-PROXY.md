# 图像生成 CORS 代理配置

由于浏览器的 CORS（跨域资源共享）限制，直接从前端调用阿里云 API 会失败。

## 解决方案

### 方案 1：使用 CORS 代理服务

你可以使用公共 CORS 代理或自建代理：

**公共代理示例：**
```
https://cors-anywhere.herokuapp.com/https://dashscope.aliyuncs.com/api/v1
```

在设置中将"千问图像 API Base URL"改为上述地址。

**注意：** 公共代理可能不稳定，不建议生产环境使用。

### 方案 2：自建代理服务器

创建一个简单的 Node.js 代理：

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

app.use('/api', createProxyMiddleware({
  target: 'https://dashscope.aliyuncs.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/v1'
  }
}));

app.listen(3001, () => {
  console.log('代理服务器运行在 http://localhost:3001');
});
```

然后在设置中配置：`http://localhost:3001/api`

### 方案 3：浏览器扩展

临时测试可以使用浏览器扩展禁用 CORS：
- Chrome: "CORS Unblock" 或 "Allow CORS"
- Firefox: "CORS Everywhere"

**警告：** 仅用于开发测试，不要在生产环境使用。

### 方案 4：部署后端服务

推荐在生产环境中部署后端 API 服务，由后端调用阿里云 API，前端调用你的后端。

## 配置步骤

1. 打开设置（左下角）
2. 找到"千问图像 配置"
3. 修改"API Base URL"为代理地址
4. 保存并重试
