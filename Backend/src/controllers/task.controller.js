// 微调任务控制器：任务增删改查（登录用户可用，按创建人隔离数据，管理员可管理全部）
const Task = require('../models/Task')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')

/**
 * 数据权限范围：普通用户仅可见自己的任务，管理员可见全部
 * @param {object} user req.user（JWT 载荷，含 id / role）
 * @returns {object} Mongoose 查询条件
 */
const scopeOf = (user) => (user.role === 'admin' ? {} : { createdBy: user.id })

/** 任务列表：支持 status 过滤与分页/关键词搜索；普通用户只能看到自己的任务 */
exports.getTasks = async (req, res, next) => {
  try {
    const filter = { ...scopeOf(req.user) }
    if (req.query.status) {
      filter.status = req.query.status
    }
    const sort = { createdAt: -1 }
    // 与其他模块保持一致：不带分页参数返回数组，带分页参数返回分页结构
    if (!isPageRequest(req.query)) {
      const tasks = await Task.find({ ...filter, isDeleted: { $ne: true } }).sort(sort)
      return ok(res, tasks)
    }
    const result = await paginate(Task, {
      query: req.query,
      filter,
      searchFields: ['name', 'baseModel'],
      sort
    })
    ok(res, result)
  } catch (error) {
    next(error)
  }
}

/** 任务详情：越权访问统一返回 404，避免泄露任务是否存在 */
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
      ...scopeOf(req.user)
    })
    if (!task) {
      throw ApiError.notFound('任务不存在')
    }
    ok(res, task)
  } catch (error) {
    next(error)
  }
}

/** 新增任务：创建人记为当前登录用户，初始状态 pending */
exports.createTask = async (req, res, next) => {
  try {
    const { name, datasetUrl, baseModel } = req.body
    const task = await Task.create({ name, datasetUrl, baseModel, createdBy: req.user.id })
    ok(res, task, '新增成功')
  } catch (error) {
    next(error)
  }
}

/** 更新任务：仅本人或管理员可操作（软删除的数据不可更新） */
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true }, ...scopeOf(req.user) },
      req.body,
      { new: true }
    )
    if (!task) {
      throw ApiError.notFound('任务不存在')
    }
    ok(res, task, '更新成功')
  } catch (error) {
    next(error)
  }
}

/** 删除任务（软删除）：仅本人或管理员可操作 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true }, ...scopeOf(req.user) },
      { isDeleted: true },
      { new: true }
    )
    if (!task) {
      throw ApiError.notFound('任务不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
