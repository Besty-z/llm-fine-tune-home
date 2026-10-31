// 全局异常中间件：统一把错误转换为 { code, message, data } 响应
// 开发环境返回详细错误与堆栈，生产环境只返回通用提示，避免泄露内部信息
const ApiError = require('../utils/apiError')
const logger = require('../utils/logger')
const { fail } = require('../utils/resp')

const isDev = process.env.NODE_ENV !== 'production'

/** 404 处理：未匹配的路由统一走这里 */
exports.notFound = (req, res, next) => {
  next(ApiError.notFound(`接口不存在: ${req.method} ${req.originalUrl}`))
}

/** 全局异常处理（Express 约定四参数签名，next 不可省略） */
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  // Mongoose 参数转换失败（如非法 ObjectId）统一按 400 处理
  if (err.name === 'CastError') {
    err = ApiError.badRequest('参数格式不正确')
  }
  // Mongoose 唯一索引冲突
  if (err.code === 11000) {
    err = ApiError.badRequest('数据已存在，请勿重复提交')
  }
  // multer 上传错误（文件超限、字段错误等）
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? '文件大小超出限制（最大 2MB）' : `上传失败: ${err.message}`
    err = ApiError.badRequest(message)
  }

  const statusCode = err.statusCode || 500

  // 5xx 记录完整错误日志（落文件），4xx 仅控制台提示
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} -> ${err.stack || err.message}`)
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} -> ${statusCode} ${err.message}`)
  }

  // 生产环境下 5xx 不暴露内部错误细节；开发环境附带堆栈便于调试
  if (statusCode >= 500 && !isDev) {
    return fail(res, 500, '服务器内部错误')
  }
  const data = isDev && statusCode >= 500 ? { stack: err.stack } : null
  res.status(statusCode).json({ code: statusCode, message: err.message || '服务器内部错误', data })
}
