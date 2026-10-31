// 微调任务模块入参校验规则
const { z } = require('zod')

// 新增任务：仅需名称、数据集地址、基础模型，状态默认 pending
const createTaskSchema = z.object({
  name: z.string({ error: '任务名称不能为空' }).trim().min(1, '任务名称不能为空').max(50, '任务名称最多 50 个字符'),
  datasetUrl: z.string({ error: '数据集地址不能为空' }).url('数据集地址格式不正确'),
  baseModel: z.string({ error: '基础模型不能为空' }).trim().min(1, '基础模型不能为空').max(50, '基础模型最多 50 个字符')
})

// 更新任务：字段均可选，但至少提交一个字段
const updateTaskSchema = z
  .object({
    name: z.string().trim().min(1, '任务名称不能为空').max(50, '任务名称最多 50 个字符').optional(),
    datasetUrl: z.string().url('数据集地址格式不正确').optional(),
    baseModel: z.string().trim().min(1, '基础模型不能为空').max(50, '基础模型最多 50 个字符').optional(),
    status: z.enum(['pending', 'running', 'success', 'failed'], { error: '任务状态不合法' }).optional(),
    logs: z.string().max(10000, '日志最多 10000 字').optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: '至少需要提交一个待更新字段' })

module.exports = { createTaskSchema, updateTaskSchema }
