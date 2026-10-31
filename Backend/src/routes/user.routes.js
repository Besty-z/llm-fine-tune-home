// 用户路由
const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')

router.post('/register', userController.register)                 // 注册（公开）
router.post('/login', userController.login)                       // 登录（公开）
router.get('/', verifyToken, requireAdmin, userController.getUsers) // 用户列表（仅管理员）

module.exports = router
