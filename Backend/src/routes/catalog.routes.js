// 微调目录路由：公开接口，登录前后均可读取（用于表单下拉与说明展示）
const express = require('express')
const router = express.Router()
const catalogController = require('../controllers/catalog.controller')

/**
 * @swagger
 * tags:
 *   name: Catalog
 *   description: 微调目录（模型 / 数据集 / 微调方法）
 */

/**
 * @swagger
 * /catalog:
 *   get:
 *     summary: 获取微调目录
 *     tags: [Catalog]
 *     responses:
 *       200:
 *         description: 返回 models / datasets / methods / defaults
 */
router.get('/', catalogController.getCatalog)

module.exports = router
