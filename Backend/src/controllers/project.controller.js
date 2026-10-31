// 开源项目控制器（占位）：TODO 后续补充业务逻辑

/** 榜单列表：按 Star 数降序返回 */
exports.getProjects = async (req, res) => {
  // TODO: Project.find().sort({ stars: -1 })
  res.json({ message: 'getProjects 接口待实现' })
}

/** 新增项目 */
exports.createProject = async (req, res) => {
  // TODO: 校验入参 -> 写入 Project 集合
  res.json({ message: 'createProject 接口待实现' })
}

/** 更新项目 */
exports.updateProject = async (req, res) => {
  // TODO: 按 id 更新项目信息
  res.json({ message: 'updateProject 接口待实现' })
}

/** 删除项目 */
exports.deleteProject = async (req, res) => {
  // TODO: 按 id 删除项目
  res.json({ message: 'deleteProject 接口待实现' })
}
