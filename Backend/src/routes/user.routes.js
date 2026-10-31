// 用户路由：注册/登录公开，用户列表仅管理员
const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../validations/user.validation')

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户账号
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: 用户注册（首个注册用户自动成为管理员）
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin, description: 用户名（2-20 位） }
 *               password: { type: string, example: admin123, description: 密码（6-64 位） }
 *     responses:
 *       200:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' }
 *       400:
 *         description: 参数校验失败或用户名已存在
 */
router.post('/register', validate({ body: registerSchema }), userController.register)

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: 用户登录，返回 JWT
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: admin123 }
 *     responses:
 *       200:
 *         description: 登录成功，data 中包含 token
 *       400:
 *         description: 用户名或密码错误
 */
router.post('/login', validate({ body: loginSchema }), userController.login)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 用户列表（仅管理员）
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 用户列表（不含密码字段）
 *       401:
 *         description: 未登录或 Token 无效
 *       403:
 *         description: 非管理员
 */
router.get('/', verifyToken, requireAdmin, userController.getUsers)

module.exports = router
