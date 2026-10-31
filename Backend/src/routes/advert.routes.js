// 广告路由：查询公开，增删改需管理员权限
const express = require('express')
const router = express.Router()
const advertController = require('../controllers/advert.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createAdvertSchema, updateAdvertSchema } = require('../validations/advert.validation')

/**
 * @swagger
 * tags:
 *   name: Adverts
 *   description: 广告位
 */

/**
 * @swagger
 * /adverts:
 *   get:
 *     summary: 广告列表（仅启用中的广告）
 *     tags: [Adverts]
 *     parameters:
 *       - in: query
 *         name: position
 *         schema: { type: string }
 *         description: 投放位置过滤（home / sidebar 等）
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词（模糊匹配 title）
 *     responses:
 *       200:
 *         description: 不传分页参数返回数组；传分页参数返回分页结构
 */
router.get('/', advertController.getAdverts)

/**
 * @swagger
 * /adverts:
 *   post:
 *     summary: 新增广告（管理员）
 *     tags: [Adverts]
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
 *               imageUrl: { type: string }
 *               linkUrl: { type: string }
 *               position: { type: string, default: home }
 *               sort: { type: integer, default: 0 }
 *               enabled: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: 新增成功
 *       400:
 *         description: 参数校验失败
 */
router.post('/', verifyToken, requireAdmin, validate({ body: createAdvertSchema }), advertController.createAdvert)

/**
 * @swagger
 * /adverts/{id}:
 *   put:
 *     summary: 更新广告（管理员）
 *     tags: [Adverts]
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
 *               imageUrl: { type: string }
 *               linkUrl: { type: string }
 *               position: { type: string }
 *               sort: { type: integer }
 *               enabled: { type: boolean }
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 广告不存在
 */
router.put('/:id', verifyToken, requireAdmin, validate({ body: updateAdvertSchema }), advertController.updateAdvert)

/**
 * @swagger
 * /adverts/{id}:
 *   delete:
 *     summary: 删除广告（管理员，软删除）
 *     tags: [Adverts]
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
 *         description: 广告不存在
 */
router.delete('/:id', verifyToken, requireAdmin, advertController.deleteAdvert)

module.exports = router
