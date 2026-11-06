// 用户路由：注册/登录公开，用户列表仅管理员
const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema, updateProfileSchema } = require('../validations/user.validation')

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
 * /users/profile:
 *   get:
 *     summary: 获取个人信息（当前登录用户）
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: 个人信息（不含密码字段）
 *       401:
 *         description: 未登录或 Token 无效
 */
router.get('/profile', verifyToken, userController.getProfile)

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: 修改个人资料（仅本人，头像地址来自 /upload/image 上传接口）
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string, example: 微调小能手, description: 昵称（1-30 字） }
 *               avatar: { type: string, example: /uploads/xxx.png, description: 头像地址（本站上传路径或外链，留空清除） }
 *               bio: { type: string, example: 专注 LLM 微调, description: 个人简介（最多 200 字） }
 *     responses:
 *       200:
 *         description: 更新成功，返回最新个人资料
 *       400:
 *         description: 参数校验失败
 *       401:
 *         description: 未登录或 Token 无效
 */
router.put('/profile', verifyToken, validate({ body: updateProfileSchema }), userController.updateProfile)

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
