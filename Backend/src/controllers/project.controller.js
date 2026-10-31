// 开源项目控制器：榜单增删改查（软删除 + 可选分页）
const Project = require('../models/Project')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')

/** 榜单列表：按 Star 数降序；携带 page/pageSize/keyword 时返回分页结构 */
exports.getProjects = async (req, res, next) => {
  try {
    // 兼容旧契约：不带分页参数时直接返回数组
    if (!isPageRequest(req.query)) {
      const projects = await Project.find({ isDeleted: { $ne: true } }).sort({ stars: -1 })
      return ok(res, projects)
    }
    const result = await paginate(Project, {
      query: req.query,
      searchFields: ['name', 'description'],
      sort: { stars: -1 }
    })
    ok(res, result)
  } catch (error) {
    next(error)
  }
}

/** 新增项目（管理员） */
exports.createProject = async (req, res, next) => {
  try {
    const { name, githubUrl, repo, description } = req.body
    const exists = await Project.findOne({ name, isDeleted: { $ne: true } })
    if (exists) {
      throw ApiError.badRequest('该项目已存在')
    }
    const project = await Project.create({ name, githubUrl, repo, description })
    ok(res, project, '新增成功')
  } catch (error) {
    next(error)
  }
}

/** 更新项目（管理员，软删除的数据不可更新） */
exports.updateProject = async (req, res, next) => {
  try {
    // new: true 返回更新后的文档
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true }
    )
    if (!project) {
      throw ApiError.notFound('项目不存在')
    }
    ok(res, project, '更新成功')
  } catch (error) {
    next(error)
  }
}

/** 删除项目（管理员，软删除：仅标记 isDeleted，数据可恢复） */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    )
    if (!project) {
      throw ApiError.notFound('项目不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
