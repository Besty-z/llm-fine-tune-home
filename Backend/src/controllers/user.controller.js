// 用户控制器：注册 / 登录（JWT 签发）/ 用户列表
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { ok, fail } = require('../utils/resp')

/** 用户注册（首个注册用户自动设为管理员，便于课程演示） */
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return fail(res, 400, '用户名和密码不能为空')
    }
    // 用户名查重
    const exists = await User.findOne({ username })
    if (exists) {
      return fail(res, 400, '用户名已存在')
    }
    // 密码加密存储；集为空时首个用户赋予 admin 角色
    const isFirstUser = (await User.countDocuments()) === 0
    const user = await User.create({
      username,
      password: await bcrypt.hash(password, 10),
      role: isFirstUser ? 'admin' : 'user'
    })
    ok(res, { id: user._id, username: user.username, role: user.role }, '注册成功')
  } catch (error) {
    fail(res, 500, `注册失败: ${error.message}`)
  }
}

/** 用户登录：校验密码并签发 JWT（有效期 7 天） */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return fail(res, 400, '用户名和密码不能为空')
    }
    const user = await User.findOne({ username })
    // 用户不存在或密码错误统一提示，避免泄露账号是否存在
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return fail(res, 400, '用户名或密码错误')
    }
    // 签发 JWT，载荷携带用户身份与角色
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    ok(res, { token, username: user.username, role: user.role }, '登录成功')
  } catch (error) {
    fail(res, 500, `登录失败: ${error.message}`)
  }
}

/** 用户列表（仅管理员，路由层已做权限控制） */
exports.getUsers = async (req, res) => {
  try {
    // 不返回密码字段
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    ok(res, users)
  } catch (error) {
    fail(res, 500, `查询失败: ${error.message}`)
  }
}
