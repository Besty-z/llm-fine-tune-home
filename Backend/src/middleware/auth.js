// 鉴权中间件：JWT 校验 + 管理员权限校验
const jwt = require('jsonwebtoken')
const { fail } = require('../utils/resp')

/**
 * JWT 校验：解析请求头 Authorization: Bearer <token>
 * 校验通过后将用户信息挂到 req.user（含 id / username / role）
 */
exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return fail(res, 401, '未登录或登录已过期')
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return fail(res, 401, 'Token 无效或已过期')
  }
}

/**
 * 管理员权限校验（必须在 verifyToken 之后使用）
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 403, '需要管理员权限')
  }
  next()
}
