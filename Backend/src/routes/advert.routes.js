// 广告路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const advertController = require('../controllers/advert.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')

router.get('/', advertController.getAdverts)                                  // 列表（公开）
router.post('/', verifyToken, requireAdmin, advertController.createAdvert)    // 新增（管理员）
router.put('/:id', verifyToken, requireAdmin, advertController.updateAdvert)  // 更新（管理员）
router.delete('/:id', verifyToken, requireAdmin, advertController.deleteAdvert) // 删除（管理员）

module.exports = router
