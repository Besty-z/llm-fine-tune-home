// 广告模块入参校验规则
const { z } = require('zod')

// 新增广告
const createAdvertSchema = z.object({
  title: z.string({ error: '广告标题不能为空' }).trim().min(1, '广告标题不能为空').max(50, '广告标题最多 50 字'),
  imageUrl: z.string().url('图片地址格式不正确').or(z.literal('')).optional(),
  linkUrl: z.string().url('跳转地址格式不正确').or(z.literal('')).optional(),
  position: z.string().max(30, '投放位置最多 30 字').optional(),
  sort: z.number({ error: '排序值必须为数字' }).int('排序值必须为整数').optional(),
  enabled: z.boolean({ error: 'enabled 必须为布尔值' }).optional()
})

// 更新广告：字段均可选，但至少提交一个字段
const updateAdvertSchema = createAdvertSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: '至少需要提交一个待更新字段' }
)

module.exports = { createAdvertSchema, updateAdvertSchema }
