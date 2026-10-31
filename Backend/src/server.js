// 后端服务入口：加载环境变量 -> 连接数据库 -> 注册定时任务 -> 启动 HTTP 服务
require('dotenv').config()

const app = require('./app')
const connectDB = require('./config/db')
const { startGithubStarJob } = require('./schedule/githubStar.job')

const PORT = process.env.PORT || 5000

/** 启动服务 */
const start = async () => {
  await connectDB()       // 1. 连接 MongoDB
  startGithubStarJob()    // 2. 注册 GitHub Star 定时任务
  app.listen(PORT, () => {
    console.log(`后端服务已启动: http://localhost:${PORT}`)
  })
}

start()
