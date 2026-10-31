// Zod 参数校验中间件：对请求体/查询参数/路径参数做统一校验
const ApiError = require('../utils/apiError')

/**
 * 生成校验中间件
 * @param {object} schemas 各位置对应的 Zod schema，如 { body, query, params }
 * 校验通过后以解析结果覆盖原始值（自动类型转换、剔除未知字段）
 */
const validate = (schemas = {}) => (req, res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key]
      if (!schema) continue
      const result = schema.safeParse(req[key])
      if (!result.success) {
        // 拼接首个错误信息返回，格式：字段路径 + 错误描述
        const issue = result.error.issues[0]
        const field = issue.path.join('.')
        return next(ApiError.badRequest(field ? `${field}: ${issue.message}` : issue.message))
      }
      // Express 5 中 req.query 只读，这里用 defineProperty 兼容写入解析结果
      Object.defineProperty(req, key, { value: result.data, writable: true, configurable: true })
    }
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = validate
