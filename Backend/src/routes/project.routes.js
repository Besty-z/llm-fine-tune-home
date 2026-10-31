// 开源项目路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createProjectSchema, updateProjectSchema } = require('../validations/project.validation')

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: 开源项目榜单
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: 榜单列表（按 Star 数降序）
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: 页码（携带任一分页参数时返回分页结构）
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *         description: 每页条数（上限 100）
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词（模糊匹配 name/description）
 *     responses:
 *       200:
 *         description: 不传分页参数返回数组；传分页参数返回 { list, total, page, pageSize, totalPages }
 */
router.get('/', projectController.getProjects)

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: 新增项目（管理员）
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, githubUrl, repo]
 *             properties:
 *               name: { type: string, example: LLaMA-Factory }
 *               githubUrl: { type: string, example: https://github.com/hiyouga/LLaMA-Factory }
 *               repo: { type: string, example: hiyouga/LLaMA-Factory, description: 仓库路径 owner/repo }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: 新增成功
 *       400:
 *         description: 参数校验失败或项目已存在
 */
router.post('/', verifyToken, requireAdmin, validate({ body: createProjectSchema }), projectController.createProject)

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: 更新项目（管理员）
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               githubUrl: { type: string }
 *               repo: { type: string }
 *               description: { type: string }
 *               stars: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 项目不存在
 */
router.put('/:id', verifyToken, requireAdmin, validate({ body: updateProjectSchema }), projectController.updateProject)

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: 删除项目（管理员，软删除）
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 项目不存在
 */
router.delete('/:id', verifyToken, requireAdmin, projectController.deleteProject)

module.exports = router
