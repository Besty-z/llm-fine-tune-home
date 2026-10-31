// 开源项目模块入参校验规则
const { z } = require('zod')

// 新增项目
const createProjectSchema = z.object({
  name: z.string({ error: '项目名称不能为空' }).trim().min(1, '项目名称不能为空').max(50, '项目名称最多 50 个字符'),
  githubUrl: z.string({ error: 'GitHub 地址不能为空' }).url('GitHub 地址格式不正确'),
  // 仓库路径格式：owner/repo
  repo: z
    .string({ error: '仓库路径(repo)不能为空' })
    .regex(/^[\w.-]+\/[\w.-]+$/, '仓库路径格式应为 owner/repo'),
  description: z.string().max(500, '项目简介最多 500 字').optional()
})

// 更新项目：字段均可选，但至少提交一个字段
const updateProjectSchema = createProjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: '至少需要提交一个待更新字段' }
)

module.exports = { createProjectSchema, updateProjectSchema }
