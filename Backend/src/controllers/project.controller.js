// 开源项目控制器：榜单增删改查
const Project = require('../models/Project')
const { ok, fail } = require('../utils/resp')

/** 榜单列表：按 Star 数降序返回（前端榜单页数据源） */
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ stars: -1 })
    ok(res, projects)
  } catch (error) {
    fail(res, 500, `查询失败: ${error.message}`)
  }
}

/** 新增项目（管理员） */
exports.createProject = async (req, res) => {
  try {
    const { name, githubUrl, repo, description } = req.body
    if (!name || !githubUrl || !repo) {
      return fail(res, 400, '项目名称、GitHub 地址、仓库路径(repo) 为必填项')
    }
    const exists = await Project.findOne({ name })
    if (exists) {
      return fail(res, 400, '该项目已存在')
    }
    const project = await Project.create({ name, githubUrl, repo, description })
    ok(res, project, '新增成功')
  } catch (error) {
    fail(res, 500, `新增失败: ${error.message}`)
  }
}

/** 更新项目（管理员） */
exports.updateProject = async (req, res) => {
  try {
    // new: true 返回更新后的文档
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!project) {
      return fail(res, 404, '项目不存在')
    }
    ok(res, project, '更新成功')
  } catch (error) {
    fail(res, 500, `更新失败: ${error.message}`)
  }
}

/** 删除项目（管理员） */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)
    if (!project) {
      return fail(res, 404, '项目不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    fail(res, 500, `删除失败: ${error.message}`)
  }
}
