// 文章路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const articleController = require('../controllers/article.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createArticleSchema, updateArticleSchema } = require('../validations/article.validation')

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: 技术文章
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: 文章列表（按创建时间倒序）
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: 分类过滤（tech / enterprise 等）
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词（模糊匹配 title/summary）
 *     responses:
 *       200:
 *         description: 不传分页参数返回数组；传分页参数返回分页结构
 */
router.get('/', articleController.getArticles)

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: 文章详情
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 文章详情
 *       404:
 *         description: 文章不存在
 */
router.get('/:id', articleController.getArticleById)

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: 新增文章（管理员）
 *     tags: [Articles]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               summary: { type: string }
 *               content: { type: string, description: 正文（Markdown） }
 *               category: { type: string, default: tech }
 *               published: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: 新增成功
 *       400:
 *         description: 参数校验失败
 */
router.post('/', verifyToken, requireAdmin, validate({ body: createArticleSchema }), articleController.createArticle)

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: 更新文章（管理员）
 *     tags: [Articles]
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
 *               title: { type: string }
 *               summary: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *               published: { type: boolean }
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 文章不存在
 */
router.put('/:id', verifyToken, requireAdmin, validate({ body: updateArticleSchema }), articleController.updateArticle)

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: 删除文章（管理员，软删除）
 *     tags: [Articles]
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
 *         description: 文章不存在
 */
router.delete('/:id', verifyToken, requireAdmin, articleController.deleteArticle)

module.exports = router
