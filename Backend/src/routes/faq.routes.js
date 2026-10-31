// FAQ 路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const faqController = require('../controllers/faq.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createFaqSchema, updateFaqSchema } = require('../validations/faq.validation')

/**
 * @swagger
 * tags:
 *   name: Faqs
 *   description: FAQ 问答
 */

/**
 * @swagger
 * /faqs:
 *   get:
 *     summary: FAQ 列表（按 sort 升序）
 *     tags: [Faqs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词（模糊匹配 question/answer）
 *     responses:
 *       200:
 *         description: 不传分页参数返回数组；传分页参数返回分页结构
 */
router.get('/', faqController.getFaqs)

/**
 * @swagger
 * /faqs:
 *   post:
 *     summary: 新增 FAQ（管理员）
 *     tags: [Faqs]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string }
 *               answer: { type: string }
 *               sort: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: 新增成功
 *       400:
 *         description: 参数校验失败
 */
router.post('/', verifyToken, requireAdmin, validate({ body: createFaqSchema }), faqController.createFaq)

/**
 * @swagger
 * /faqs/{id}:
 *   put:
 *     summary: 更新 FAQ（管理员）
 *     tags: [Faqs]
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
 *               question: { type: string }
 *               answer: { type: string }
 *               sort: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: FAQ 不存在
 */
router.put('/:id', verifyToken, requireAdmin, validate({ body: updateFaqSchema }), faqController.updateFaq)

/**
 * @swagger
 * /faqs/{id}:
 *   delete:
 *     summary: 删除 FAQ（管理员，软删除）
 *     tags: [Faqs]
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
 *         description: FAQ 不存在
 */
router.delete('/:id', verifyToken, requireAdmin, faqController.deleteFaq)

module.exports = router
