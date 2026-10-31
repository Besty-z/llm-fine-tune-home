// Express 应用实例：安全中间件 -> 跨域 -> 文档/静态资源 -> 业务路由 -> 统一异常处理
const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const swaggerUi = require('swagger-ui-express')
const routes = require('./routes')
const swaggerSpec = require('./config/swagger')
const { notFound, errorHandler } = require('./middleware/error')

const app = express()
const isProd = process.env.NODE_ENV === 'production'

// 安全响应头（XSS 防护、禁用 MIME 嗅探等）
// crossOriginResourcePolicy 放开以便前端页面可加载本服务的上传图片
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// CORS 跨域白名单：
// - 生产环境：仅允许 .env 的 CORS_ORIGINS 配置的域名（逗号分隔）
// - 开发环境：额外放行本地前端调试地址
const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
const whitelist = isProd ? envOrigins : [...devOrigins, ...envOrigins]
app.use(
  cors({
    origin: (origin, callback) => {
      // 无 origin 的请求（同源、curl、服务端调用）直接放行
      if (!origin || whitelist.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error(`跨域请求被拒绝: ${origin}`))
    },
    credentials: true
  })
)

app.use(express.json({ limit: '1mb' })) // 解析 JSON 请求体，限制体积防止大包攻击

// Swagger 接口文档：http://localhost:5000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// 上传文件静态访问：http://localhost:5000/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'success', data: { status: 'ok' } })
})

// 统一挂载业务路由（/api 前缀）
app.use('/api', routes)

// 404 与全局异常处理（必须放在路由之后）
app.use(notFound)
app.use(errorHandler)

module.exports = app
