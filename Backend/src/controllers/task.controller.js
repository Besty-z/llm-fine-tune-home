// 微调任务控制器：任务增删改查 + 训练执行控制（登录用户可用，按创建人隔离数据，管理员可管理全部）
const Task = require('../models/Task')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')
const taskRunner = require('../services/taskRunner')

/**
 * 数据权限范围：普通用户仅可见自己的任务，管理员可见全部
 * @param {object} user req.user（JWT 载荷，含 id / role）
 * @returns {object} Mongoose 查询条件
 */
const scopeOf = (user) => (user.role === 'admin' ? {} : { createdBy: user.id })

/**
 * 按数据权限查询任务，不存在时抛出 404（越权与不存在表现一致）
 * @param {object} req Express 请求
 * @returns {Promise<object>} 任务文档
 * @throws {ApiError} 任务不存在时抛出 404
 */
const findScopedTask = async (req) => {
  const task = await Task.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
    ...scopeOf(req.user)
  })
  if (!task) {
    throw ApiError.notFound('任务不存在')
  }
  return task
}

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
    const { name, datasetUrl, baseModel, trainingConfig } = req.body
    const task = await Task.create({
      name,
      datasetUrl: datasetUrl || '',
      baseModel,
      trainingConfig: trainingConfig || {},
      createdBy: req.user.id
    })
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

/** 启动任务：重置指标与日志，交由模拟执行器逐步推进（已运行的任务拒绝重复启动） */
exports.startTask = async (req, res, next) => {
  try {
    const task = await findScopedTask(req)
    if (task.status === 'running') {
      throw ApiError.badRequest('任务已在运行中')
    }
    const updated = await taskRunner.startTask(task)
    ok(res, updated, '任务已启动')
  } catch (error) {
    next(error)
  }
}

/** 停止任务：中断执行，状态置为 failed 并记录停止原因 */
exports.stopTask = async (req, res, next) => {
  try {
    const task = await findScopedTask(req)
    const updated = await taskRunner.stopTask(task)
    ok(res, updated, '任务已停止')
  } catch (error) {
    next(error)
  }
}

/** 任务日志：按字符偏移量增量返回，供前端轮询追加（offset 越界时重置为 0） */
exports.getTaskLogs = async (req, res, next) => {
  try {
    const task = await findScopedTask(req)
    const text = task.logs || ''
    const requested = Math.max(parseInt(req.query.offset, 10) || 0, 0)
    const reset = requested > text.length
    const offset = reset ? 0 : requested
    ok(res, {
      chunk: text.slice(offset),
      offset: text.length,
      reset,
      status: task.status,
      progress: task.progress,
      currentStep: task.currentStep,
      totalSteps: task.totalSteps,
      errorMessage: task.errorMessage
    })
  } catch (error) {
    next(error)
  }
}

/** 任务指标：返回 step >= since 的 loss / 学习率序列，供曲线增量刷新 */
exports.getTaskMetrics = async (req, res, next) => {
  try {
    const task = await findScopedTask(req)
    const since = Math.max(parseInt(req.query.since, 10) || 0, 0)
    const metrics = (task.metrics || []).filter((item) => item.step > since)
    ok(res, {
      metrics,
      status: task.status,
      progress: task.progress,
      currentStep: task.currentStep,
      totalSteps: task.totalSteps
    })
  } catch (error) {
    next(error)
  }
}
