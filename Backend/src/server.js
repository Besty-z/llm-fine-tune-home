// 后端服务入口：加载环境变量 -> 连接数据库 -> 注册定时任务 -> 启动 HTTP 服务
require('dotenv').config()

const app = require('./app')
const connectDB = require('./config/db')
const { startSyncStarJob } = require('./schedule/syncStar')

// 从 .env 读取配置（PORT / NODE_ENV 提供默认值）
const { MONGO_URI, PORT = 5000, JWT_SECRET, NODE_ENV = 'development' } = process.env

// 启动前校验关键配置
if (!MONGO_URI) {
  console.error('配置错误: .env 中缺少 MONGO_URI')
  process.exit(1)
}
if (!JWT_SECRET) {
  // JWT_SECRET 缺失不阻断启动，但登录签发会失败，给出明显警告
  console.warn('警告: .env 中缺少 JWT_SECRET，登录功能将不可用')
}

/** 启动服务 */
const start = async () => {
  await connectDB(MONGO_URI) // 1. 连接 MongoDB（失败会在 connectDB 内捕获并退出）
  startSyncStarJob()         // 2. 注册 GitHub Star 同步定时任务
  app.listen(PORT, () => {
    console.log(`[${NODE_ENV}] 后端服务已启动: http://localhost:${PORT}`)
  })
}

start()
