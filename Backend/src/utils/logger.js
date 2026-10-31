// 日志工具（winston）：控制台输出全部级别，错误级别额外落文件 logs/error.log
const path = require('path')
const winston = require('winston')

const { combine, timestamp, printf, colorize, errors } = winston.format

// 统一日志格式：时间 [级别] 消息 (堆栈)
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Error 对象自动带出堆栈
    logFormat
  ),
  transports: [
    // 控制台：彩色输出，便于开发调试
    new winston.transports.Console({
      format: combine(colorize(), logFormat)
    }),
    // 文件：仅记录 error 级别，按天排查线上问题
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    })
  ]
})

module.exports = logger
