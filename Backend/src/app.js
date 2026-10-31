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

// 404 处理：未匹配的路由
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

// 全局异常处理：兜底捕获未处理的错误，统一返回标准 JSON
app.use((err, req, res, next) => {
  console.error(`[全局异常] ${err.message}`)
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
})

module.exports = app
