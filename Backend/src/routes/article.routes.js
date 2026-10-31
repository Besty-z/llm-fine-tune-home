// 文章路由（占位）
const express = require('express')
const router = express.Router()
const articleController = require('../controllers/article.controller')

router.get('/', articleController.getArticles)       // 文章列表
router.get('/:id', articleController.getArticleById) // 文章详情
router.post('/', articleController.createArticle)    // 新增文章
router.put('/:id', articleController.updateArticle)  // 更新文章
router.delete('/:id', articleController.deleteArticle) // 删除文章

module.exports = router
