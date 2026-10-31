// MongoDB 数据库连接配置
const mongoose = require('mongoose')

/**
 * 连接 MongoDB
 * 连接串从环境变量 MONGO_URI 读取（参见 .env.example）
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB 连接成功: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`)
    process.exit(1) // 数据库不可用则直接退出进程
  }
}

module.exports = connectDB
