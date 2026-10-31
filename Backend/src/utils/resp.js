// 统一响应格式工具：所有接口返回 { code, message, data }
// code 与 HTTP 状态码保持一致，前端可据此统一处理

/**
 * 成功响应
 * @param {object} res Express 响应对象
 * @param {*} data 业务数据
 * @param {string} message 提示信息
 */
exports.ok = (res, data = null, message = 'success') => {
  res.json({ code: 200, message, data })
}

/**
 * 失败响应
 * @param {object} res Express 响应对象
 * @param {number} code HTTP 状态码（400/401/403/404/500）
 * @param {string} message 错误信息
 */
exports.fail = (res, code = 500, message = '服务器内部错误') => {
  res.status(code).json({ code, message, data: null })
}
