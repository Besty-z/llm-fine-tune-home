// Express 应用实例：中间件挂载与路由注册
const express = require('express')
const cors = require('cors')
const routes = require('./routes')

const app = express()

// 全局中间件
app.use(cors())           // 允许前端跨域访问
app.use(express.json())   // 解析 JSON 请求体

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 统一挂载业务路由（/api 前缀）
app.use('/api', routes)

module.exports = app
