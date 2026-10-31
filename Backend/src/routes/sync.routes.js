// 同步路由：GitHub Star 手动触发与同步记录查询，仅管理员可用
const express = require('express')
const router = express.Router()
const syncController = require('../controllers/sync.controller')
const { verifyToken, requireAdmin } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: GitHub Star 同步管理（仅管理员）
 */

/**
 * @swagger
 * /sync/star:
 *   post:
 *     summary: 手动触发 Star 同步（管理员）
 *     tags: [Sync]
 *     security: [{ bearerAuth: [] }]
 *     description: 并发触发将被拒绝（429）；同步完成后返回本次同步记录
 *     responses:
 *       200:
 *         description: 同步完成，data 为本次同步记录（含各仓库明细）
 *       401:
 *         description: 未登录
 *       403:
 *         description: 非管理员
 *       429:
 *         description: 已有同步任务在执行中
 */
router.post('/star', verifyToken, requireAdmin, syncController.triggerSync)

/**
 * @swagger
 * /sync/records:
 *   get:
 *     summary: 同步记录列表（管理员）
 *     tags: [Sync]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: triggerType
 *         schema: { type: string, enum: [cron, manual] }
 *         description: 触发方式过滤
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [running, success, partial, failed] }
 *         description: 状态过滤
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: 不传分页参数返回最近 50 条数组；传分页参数返回分页结构
 */
router.get('/records', verifyToken, requireAdmin, syncController.getSyncRecords)

module.exports = router
