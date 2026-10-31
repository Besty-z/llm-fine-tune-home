// 开源项目路由（占位）
const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')

router.get('/', projectController.getProjects)       // 榜单列表（按 Star 降序）
router.post('/', projectController.createProject)    // 新增项目
router.put('/:id', projectController.updateProject)  // 更新项目
router.delete('/:id', projectController.deleteProject) // 删除项目

module.exports = router
