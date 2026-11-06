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

// 修改个人资料：字段均可选，但至少提交一个字段
const updateProfileSchema = z
  .object({
    nickname: z.string().trim().min(1, '昵称不能为空').max(30, '昵称最多 30 个字符').optional(),
    // 头像支持本站上传路径或外链，留空表示清除头像
    avatar: z
      .string()
      .max(300, '头像地址最多 300 字')
      .refine((v) => v === '' || v.startsWith('/uploads/') || /^https?:\/\//.test(v), {
        message: '头像地址格式不正确'
      })
      .optional(),
    bio: z.string().max(200, '个人简介最多 200 字').optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: '至少需要提交一个待更新字段' })

module.exports = { registerSchema, loginSchema, updateProfileSchema }
