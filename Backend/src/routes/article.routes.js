// 文章路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const articleController = require('../controllers/article.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')

router.get('/', articleController.getArticles)                                  // 列表（公开）
router.get('/:id', articleController.getArticleById)                            // 详情（公开）
router.post('/', verifyToken, requireAdmin, articleController.createArticle)    // 新增（管理员）
router.put('/:id', verifyToken, requireAdmin, articleController.updateArticle)  // 更新（管理员）
router.delete('/:id', verifyToken, requireAdmin, articleController.deleteArticle) // 删除（管理员）

module.exports = router
