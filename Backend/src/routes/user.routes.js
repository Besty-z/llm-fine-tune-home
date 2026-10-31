// 用户路由（占位）
const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')

router.post('/register', userController.register) // 注册
router.post('/login', userController.login)       // 登录
router.get('/', userController.getUsers)          // 用户列表

module.exports = router
