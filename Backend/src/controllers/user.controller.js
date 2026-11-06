// 用户控制器：注册 / 登录（JWT 签发）/ 用户列表
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')

/** 用户注册（首个注册用户自动设为管理员，便于课程演示） */
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body
    // 用户名查重
    const exists = await User.findOne({ username })
    if (exists) {
      throw ApiError.badRequest('用户名已存在')
    }
    // 密码加密存储；集合为空时首个用户赋予 admin 角色
    const isFirstUser = (await User.countDocuments()) === 0
    const user = await User.create({
      username,
      password: await bcrypt.hash(password, 10),
      role: isFirstUser ? 'admin' : 'user'
    })
    ok(res, { id: user._id, username: user.username, role: user.role }, '注册成功')
  } catch (error) {
    next(error)
  }
}

/** 用户登录：校验密码并签发 JWT（有效期 7 天） */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    // 用户不存在或密码错误统一提示，避免泄露账号是否存在
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw ApiError.badRequest('用户名或密码错误')
    }
    // 签发 JWT，载荷携带用户身份与角色
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    ok(res, { token, username: user.username, role: user.role }, '登录成功')
  } catch (error) {
    next(error)
  }
}

/** 用户列表（仅管理员，路由层已做权限控制） */
exports.getUsers = async (req, res, next) => {
  try {
    // 不返回密码字段
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    ok(res, users)
  } catch (error) {
    next(error)
  }
}

/** 获取个人信息（当前登录用户，不返回密码字段） */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      throw ApiError.notFound('用户不存在')
    }
    ok(res, user)
  } catch (error) {
    next(error)
  }
}

/** 修改个人资料（仅本人：从 JWT 取当前用户 id，天然隔离他人账号） */
exports.updateProfile = async (req, res, next) => {
  try {
    const { nickname, avatar, bio } = req.body
    // 只更新提交的字段，未提交字段保持不变
    const updates = {}
    if (nickname !== undefined) updates.nickname = nickname
    if (avatar !== undefined) updates.avatar = avatar
    if (bio !== undefined) updates.bio = bio
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password')
    if (!user) {
      throw ApiError.notFound('用户不存在')
    }
    ok(res, user, '更新成功')
  } catch (error) {
    next(error)
  }
}
