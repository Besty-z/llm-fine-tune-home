// 路由汇总：统一挂载各业务模块路由
const express = require('express')
const router = express.Router()

router.use('/users', require('./user.routes'))       // 用户
router.use('/projects', require('./project.routes')) // 开源项目榜单
router.use('/faqs', require('./faq.routes'))         // FAQ 问答
router.use('/articles', require('./article.routes')) // 文章
router.use('/adverts', require('./advert.routes'))   // 广告
router.use('/upload', require('./upload.routes'))    // 图片上传
router.use('/tasks', require('./task.routes'))       // LLM 微调任务
router.use('/sync', require('./sync.routes'))        // Star 同步管理

module.exports = router
