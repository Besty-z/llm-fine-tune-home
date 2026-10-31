// 业务异常类：携带 HTTP 状态码，由全局异常中间件统一转换为标准响应
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP 状态码（400/401/403/404/500）
   * @param {string} message 面向用户的错误信息
   */
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
    // 标记为可预期的业务异常，全局异常中间件据此区分系统错误
    this.isOperational = true
  }

  static badRequest(message = '请求参数错误') {
    return new ApiError(400, message)
  }

  static unauthorized(message = '未登录或登录已过期') {
    return new ApiError(401, message)
  }

  static forbidden(message = '没有操作权限') {
    return new ApiError(403, message)
  }

  static notFound(message = '资源不存在') {
    return new ApiError(404, message)
  }
}

module.exports = ApiError
