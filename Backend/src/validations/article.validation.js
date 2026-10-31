// 文章模块入参校验规则
const { z } = require('zod')

// 新增文章
const createArticleSchema = z.object({
  title: z.string({ error: '文章标题不能为空' }).trim().min(1, '文章标题不能为空').max(100, '标题最多 100 字'),
  summary: z.string().max(300, '摘要最多 300 字').optional(),
  content: z.string().optional(),
  category: z.string().max(30, '分类名最多 30 字').optional(),
  published: z.boolean({ error: 'published 必须为布尔值' }).optional()
})

// 更新文章：字段均可选，但至少提交一个字段
const updateArticleSchema = createArticleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: '至少需要提交一个待更新字段' }
)

module.exports = { createArticleSchema, updateArticleSchema }
