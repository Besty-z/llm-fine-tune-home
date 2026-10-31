// 用户模块入参校验规则
const { z } = require('zod')

// 注册：用户名 2-20 位，密码至少 6 位
const registerSchema = z.object({
  username: z
    .string({ error: '用户名不能为空' })
    .trim()
    .min(2, '用户名至少 2 个字符')
    .max(20, '用户名最多 20 个字符'),
  password: z
    .string({ error: '密码不能为空' })
    .min(6, '密码至少 6 位')
    .max(64, '密码最多 64 位')
})

// 登录：只校验非空，具体规则交给账号密码比对
const loginSchema = z.object({
  username: z.string({ error: '用户名不能为空' }).trim().min(1, '用户名不能为空'),
  password: z.string({ error: '密码不能为空' }).min(1, '密码不能为空')
})

module.exports = { registerSchema, loginSchema }
