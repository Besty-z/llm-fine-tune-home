// MongoDB 数据库连接配置
const mongoose = require('mongoose')

/**
 * 连接 MongoDB
 * @param {string} mongoUri 连接串（由入口从 .env 的 MONGO_URI 读入）
 */
const connectDB = async (mongoUri) => {
  try {
    // serverSelectionTimeoutMS：数据库不可用时 5 秒快速失败，便于开发调试
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log(`MongoDB 连接成功: ${conn.connection.host}/${conn.connection.name}`)
  } catch (error) {
    console.error(`MongoDB 连接失败: ${error.message}`)
    process.exit(1) // 数据库不可用则直接退出进程
  }
}

module.exports = connectDB
