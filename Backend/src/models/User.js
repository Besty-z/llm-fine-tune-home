// 用户模型：站点登录账号
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true }, // 用户名
    password: { type: String, required: true },                           // 密码（存储加密后的哈希）
    role: { type: String, enum: ['user', 'admin'], default: 'user' }      // 角色
  },
  { timestamps: true } // 自动维护 createdAt / updatedAt
)

module.exports = mongoose.model('User', userSchema)
