// 微调任务模块入参校验规则
const { z } = require('zod')

// 训练超参：字段均可选，由控制器与默认值合并
const trainingConfigSchema = z
  .object({
    method: z.enum(['lora', 'qlora', 'full'], { error: '微调方法不合法' }).optional(),
    dataset: z.string().trim().max(100, '数据集标识最多 100 个字符').optional(),
    learningRate: z.number({ error: '学习率必须为数字' }).min(1e-7, '学习率过小').max(1, '学习率不能大于 1').optional(),
    epochs: z.number().int('训练轮数必须为整数').min(1, '训练轮数至少为 1').max(20, '训练轮数最多 20').optional(),
    batchSize: z.number().int('批大小必须为整数').min(1, '批大小至少为 1').max(64, '批大小最多 64').optional(),
    gradientAccumulation: z.number().int().min(1, '梯度累积至少为 1').max(64, '梯度累积最多 64').optional(),
    loraRank: z.number().int().min(1, 'LoRA 秩至少为 1').max(128, 'LoRA 秩最多 128').optional(),
    loraAlpha: z.number().int().min(1, 'LoRA alpha 至少为 1').max(256, 'LoRA alpha 最多 256').optional(),
    cutoffLen: z.number().int().min(128, '截断长度至少 128').max(8192, '截断长度最多 8192').optional(),
    quantBits: z.union([z.literal(4), z.literal(8)], { error: '量化位数只能为 4 或 8' }).optional()
  })
  .optional()

// 新增任务：名称与基座模型必填；数据集地址可选（使用内置目录数据集时留空）
const createTaskSchema = z.object({
  name: z.string({ error: '任务名称不能为空' }).trim().min(1, '任务名称不能为空').max(50, '任务名称最多 50 个字符'),
  datasetUrl: z.union([z.string().url('数据集地址格式不正确'), z.literal('')]).optional(),
  baseModel: z.string({ error: '基础模型不能为空' }).trim().min(1, '基础模型不能为空').max(50, '基础模型最多 50 个字符'),
  trainingConfig: trainingConfigSchema
})

// 更新任务：字段均可选，但至少提交一个字段
const updateTaskSchema = z
  .object({
    name: z.string().trim().min(1, '任务名称不能为空').max(50, '任务名称最多 50 个字符').optional(),
    datasetUrl: z.union([z.string().url('数据集地址格式不正确'), z.literal('')]).optional(),
    baseModel: z.string().trim().min(1, '基础模型不能为空').max(50, '基础模型最多 50 个字符').optional(),
    status: z.enum(['pending', 'running', 'success', 'failed'], { error: '任务状态不合法' }).optional(),
    logs: z.string().max(20000, '日志最多 20000 字').optional(),
    trainingConfig: trainingConfigSchema
  })
  .refine((data) => Object.keys(data).length > 0, { message: '至少需要提交一个待更新字段' })

module.exports = { createTaskSchema, updateTaskSchema }
