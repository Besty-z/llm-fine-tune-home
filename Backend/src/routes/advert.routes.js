// 广告路由（占位）
const express = require('express')
const router = express.Router()
const advertController = require('../controllers/advert.controller')

router.get('/', advertController.getAdverts)       // 广告列表
router.post('/', advertController.createAdvert)    // 新增广告
router.put('/:id', advertController.updateAdvert)  // 更新广告
router.delete('/:id', advertController.deleteAdvert) // 删除广告

module.exports = router
