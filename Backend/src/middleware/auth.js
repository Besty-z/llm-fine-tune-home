// RBAC 鉴权中间件：登录校验（verifyToken）+ 角色校验（requireRole / requireAdmin）
const jwt = require('jsonwebtoken')
const ApiError = require('../utils/apiError')

/**
 * 登录校验：解析请求头 Authorization: Bearer <token>
 * 校验通过后将用户信息挂到 req.user（含 id / username / role）
 */
exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return next(ApiError.unauthorized('未登录或登录已过期'))
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return next(ApiError.unauthorized('Token 无效或已过期'))
  }
}

/**
 * 角色校验（必须在 verifyToken 之后使用）
 * @param {...string} roles 允许访问的角色，如 requireRole('admin', 'editor')
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('未登录或登录已过期'))
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`需要 ${roles.join('/')} 权限`))
  }
  next()
}

// 管理员角色校验（requireRole 的常用预设）
exports.requireAdmin = exports.requireRole('admin')
