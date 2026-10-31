// 微调任务模型：LLM 微调任务，按创建用户隔离数据
const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },                    // 任务名称
    datasetUrl: { type: String, required: true },                          // 数据集地址
    baseModel: { type: String, required: true },                           // 基础模型（如 Qwen2.5-7B）
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed'],                   // 任务状态
      default: 'pending'
    },
    logs: { type: String, default: '' },                                   // 任务日志
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // 创建用户
    isDeleted: { type: Boolean, default: false, index: true }              // 软删除标记（查询默认过滤）
  },
  { timestamps: true }
)

module.exports = mongoose.model('Task', taskSchema)
