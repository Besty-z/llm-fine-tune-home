// 图片上传路由：登录用户可用（头像、广告图等场景），multer 限制图片格式与大小
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const express = require('express')
const multer = require('multer')
const router = express.Router()
const { verifyToken } = require('../middleware/auth')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')

// 上传目录：Backend/uploads（启动时确保存在）
const UPLOAD_DIR = path.join(__dirname, '../../uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// 允许的图片类型与大小限制（2MB）
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024

// 磁盘存储：随机文件名防止覆盖与路径穿越，保留原始扩展名
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(ApiError.badRequest('仅支持 jpg/png/gif/webp 格式的图片'))
    }
    cb(null, true)
  }
})

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: 文件上传
 */

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: 上传图片（登录用户，限 jpg/png/gif/webp，最大 2MB）
 *     tags: [Upload]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: 上传成功，data.url 为可访问的图片路径
 *       400:
 *         description: 未选择文件或格式/大小不符合要求
 *       401:
 *         description: 未登录
 */
router.post(
  '/image',
  verifyToken,
  upload.single('file'),
  (req, res, next) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('请选择要上传的图片')
      }
      // 返回相对路径，前端拼接服务地址即可访问（app.js 已挂载 /uploads 静态目录）
      ok(res, { url: `/uploads/${req.file.filename}` }, '上传成功')
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
