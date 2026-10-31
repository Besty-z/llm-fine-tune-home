// FAQ 路由（占位）
const express = require('express')
const router = express.Router()
const faqController = require('../controllers/faq.controller')

router.get('/', faqController.getFaqs)          // FAQ 列表
router.post('/', faqController.createFaq)       // 新增 FAQ
router.put('/:id', faqController.updateFaq)     // 更新 FAQ
router.delete('/:id', faqController.deleteFaq)  // 删除 FAQ

module.exports = router
