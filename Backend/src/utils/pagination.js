// 通用分页搜索工具：各列表接口复用，自动过滤软删除数据
const MAX_PAGE_SIZE = 100 // 单页上限，防止恶意大分页拖垮数据库

/**
 * 通用分页查询
 * @param {object} Model Mongoose 模型
 * @param {object} options 查询选项
 * @param {object} [options.query] Express req.query（读取 page / pageSize / keyword）
 * @param {string[]} [options.searchFields] keyword 模糊匹配的字段（正则 OR 查询）
 * @param {object} [options.filter] 额外过滤条件
 * @param {object} [options.sort] 排序规则，默认创建时间倒序
 * @param {string} [options.select] 字段筛选（如 '-password'）
 * @returns {Promise<{list: Array, total: number, page: number, pageSize: number, totalPages: number}>}
 */
const paginate = async (Model, options = {}) => {
  const { query = {}, searchFields = [], filter = {}, sort = { createdAt: -1 }, select } = options

  // 页码与每页条数兜底：page >= 1，1 <= pageSize <= MAX_PAGE_SIZE
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 10, 1), MAX_PAGE_SIZE)

  // 组装查询条件：默认排除软删除
  const conditions = { ...filter, isDeleted: { $ne: true } }
  const keyword = (query.keyword || '').trim()
  if (keyword && searchFields.length > 0) {
    // 多字段模糊搜索（不区分大小写）
    const regex = new RegExp(escapeRegex(keyword), 'i')
    conditions.$or = searchFields.map((field) => ({ [field]: regex }))
  }

  // 并行查询列表与总数
  const [list, total] = await Promise.all([
    Model.find(conditions)
      .select(select)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Model.countDocuments(conditions)
  ])

  return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * 判断请求是否需要分页返回（携带 page/pageSize/keyword 任一参数即视为分页请求）
 * 用于兼容旧契约：不传分页参数时列表接口仍返回数组
 * @param {object} query Express req.query
 * @returns {boolean}
 */
const isPageRequest = (query = {}) => {
  return query.page !== undefined || query.pageSize !== undefined || query.keyword !== undefined
}

/** 转义正则特殊字符，防止 keyword 注入非法正则 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

module.exports = { paginate, isPageRequest }
