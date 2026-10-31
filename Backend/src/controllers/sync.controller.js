// 同步控制器：GitHub Star 手动触发 + 同步记录查询（仅管理员）
const SyncRecord = require('../models/SyncRecord')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')
const { syncAllStars, isSyncing } = require('../schedule/syncStar')

/** 手动触发 Star 同步（管理员）；已有任务在执行时拒绝并发触发 */
exports.triggerSync = async (req, res, next) => {
  try {
    if (isSyncing()) {
      throw new ApiError(429, '同步任务正在执行中，请稍后再试')
    }
    const record = await syncAllStars('manual')
    ok(res, record, '同步完成')
  } catch (error) {
    next(error)
  }
}

/** 同步记录列表（管理员）：按开始时间倒序，支持分页与触发方式过滤 */
exports.getSyncRecords = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.triggerType) {
      filter.triggerType = req.query.triggerType
    }
    if (req.query.status) {
      filter.status = req.query.status
    }
    const sort = { startedAt: -1 }
    // SyncRecord 无 isDeleted 字段，直接查询；分页参数存在时返回分页结构
    if (!isPageRequest(req.query)) {
      const records = await SyncRecord.find(filter).sort(sort).limit(50) // 无分页参数时限制最近 50 条
      return ok(res, records)
    }
    const result = await paginate(SyncRecord, { query: req.query, filter, sort })
    ok(res, result)
  } catch (error) {
    next(error)
  }
}
