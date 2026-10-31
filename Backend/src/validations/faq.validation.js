// FAQ 模块入参校验规则
const { z } = require('zod')

// 新增 FAQ
const createFaqSchema = z.object({
  question: z.string({ error: '问题不能为空' }).trim().min(1, '问题不能为空').max(200, '问题最多 200 字'),
  answer: z.string({ error: '答案不能为空' }).trim().min(1, '答案不能为空'),
  sort: z.number({ error: '排序值必须为数字' }).int('排序值必须为整数').optional()
})

// 更新 FAQ：字段均可选，但至少提交一个字段
const updateFaqSchema = createFaqSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: '至少需要提交一个待更新字段' }
)

module.exports = { createFaqSchema, updateFaqSchema }
