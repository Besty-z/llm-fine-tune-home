// 微调任务路由：全部接口需登录；普通用户仅能操作自己的任务，管理员可操作全部
const express = require('express')
const router = express.Router()
const taskController = require('../controllers/task.controller')
const { verifyToken } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createTaskSchema, updateTaskSchema } = require('../validations/task.validation')

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: LLM 微调任务（需登录；普通用户仅可操作自己的任务，管理员可操作全部）
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: 任务列表（按创建时间倒序）
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, running, success, failed] }
 *         description: 状态过滤
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 关键词（模糊匹配 name/baseModel）
 *     responses:
 *       200:
 *         description: 不传分页参数返回数组；传分页参数返回分页结构
 *       401:
 *         description: 未登录
 */
router.get('/', verifyToken, taskController.getTasks)

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: 任务详情
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 任务详情
 *       404:
 *         description: 任务不存在（或非本人任务）
 */
router.get('/:id', verifyToken, taskController.getTaskById)

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: 新增微调任务
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, baseModel]
 *             properties:
 *               name: { type: string, example: Qwen2.5-7B LoRA 微调 }
 *               datasetUrl: { type: string, description: 自定义数据集地址（可选） }
 *               baseModel: { type: string, example: Qwen2.5-7B }
 *               trainingConfig:
 *                 type: object
 *                 description: 训练超参（缺省使用默认值）
 *                 properties:
 *                   method: { type: string, enum: [lora, qlora, full], default: lora }
 *                   dataset: { type: string, example: alpaca_zh }
 *                   learningRate: { type: number, default: 0.0002 }
 *                   epochs: { type: integer, default: 3 }
 *                   batchSize: { type: integer, default: 4 }
 *                   gradientAccumulation: { type: integer, default: 4 }
 *                   loraRank: { type: integer, default: 8 }
 *                   loraAlpha: { type: integer, default: 16 }
 *                   cutoffLen: { type: integer, default: 1024 }
 *                   quantBits: { type: integer, enum: [4, 8], default: 4 }
 *     responses:
 *       200:
 *         description: 新增成功，初始状态 pending
 *       400:
 *         description: 参数校验失败
 */
router.post('/', verifyToken, validate({ body: createTaskSchema }), taskController.createTask)

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: 更新任务（含状态与日志）
 *     tags: [Tasks]
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
 *               datasetUrl: { type: string }
 *               baseModel: { type: string }
 *               status: { type: string, enum: [pending, running, success, failed] }
 *               logs: { type: string }
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 任务不存在（或非本人任务）
 */
router.put('/:id', verifyToken, validate({ body: updateTaskSchema }), taskController.updateTask)

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: 删除任务（软删除）
 *     tags: [Tasks]
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
 *         description: 任务不存在（或非本人任务）
 */
router.delete('/:id', verifyToken, taskController.deleteTask)

/**
 * @swagger
 * /tasks/{id}/start:
 *   post:
 *     summary: 启动训练（模拟执行器逐步推进）
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 启动成功，状态 running
 *       400:
 *         description: 任务已在运行
 *       404:
 *         description: 任务不存在（或非本人任务）
 */
router.post('/:id/start', verifyToken, taskController.startTask)

/**
 * @swagger
 * /tasks/{id}/stop:
 *   post:
 *     summary: 停止训练（状态置为 failed 并记录原因）
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 停止成功
 *       400:
 *         description: 任务当前没有在运行
 *       404:
 *         description: 任务不存在（或非本人任务）
 */
router.post('/:id/stop', verifyToken, taskController.stopTask)

/**
 * @swagger
 * /tasks/{id}/logs:
 *   get:
 *     summary: 增量获取任务日志
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *         description: 上次返回的字符偏移量
 *     responses:
 *       200:
 *         description: 返回 { chunk, offset, reset, status, progress }
 *       404:
 *         description: 任务不存在（或非本人任务）
 */
router.get('/:id/logs', verifyToken, taskController.getTaskLogs)

/**
 * @swagger
 * /tasks/{id}/metrics:
 *   get:
 *     summary: 增量获取 loss / 学习率指标
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: since
 *         schema: { type: integer, default: 0 }
 *         description: 只返回 step 大于该值的指标点
 *     responses:
 *       200:
 *         description: 返回 { metrics, status, progress }
 *       404:
 *         description: 任务不存在（或非本人任务）
 */
router.get('/:id/metrics', verifyToken, taskController.getTaskMetrics)

module.exports = router
