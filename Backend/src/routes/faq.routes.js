// FAQ 路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const faqController = require('../controllers/faq.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')

router.get('/', faqController.getFaqs)                                  // FAQ 列表（公开）
router.post('/', verifyToken, requireAdmin, faqController.createFaq)    // 新增（管理员）
router.put('/:id', verifyToken, requireAdmin, faqController.updateFaq)  // 更新（管理员）
router.delete('/:id', verifyToken, requireAdmin, faqController.deleteFaq) // 删除（管理员）

module.exports = router
