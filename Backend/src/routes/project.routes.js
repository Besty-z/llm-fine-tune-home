// 开源项目路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')

router.get('/', projectController.getProjects)                                  // 榜单列表（公开）
router.post('/', verifyToken, requireAdmin, projectController.createProject)    // 新增（管理员）
router.put('/:id', verifyToken, requireAdmin, projectController.updateProject)  // 更新（管理员）
router.delete('/:id', verifyToken, requireAdmin, projectController.deleteProject) // 删除（管理员）

module.exports = router
