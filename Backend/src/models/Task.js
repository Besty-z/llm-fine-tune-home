// 微调任务模型：LLM 微调任务，按创建用户隔离数据
const mongoose = require('mongoose')

// 训练超参配置：对应 LLaMA-Board 表单中的「训练参数」区域
const trainingConfigSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['lora', 'qlora', 'full'], default: 'lora' }, // 微调方法
    dataset: { type: String, default: '' },                                     // 数据集标识（如 alpaca_zh）
    learningRate: { type: Number, default: 2e-4 },                              // 学习率
    epochs: { type: Number, default: 3 },                                       // 训练轮数
    batchSize: { type: Number, default: 4 },                                    // 每卡批大小
    gradientAccumulation: { type: Number, default: 4 },                         // 梯度累积步数
    loraRank: { type: Number, default: 8 },                                     // LoRA 秩（r）
    loraAlpha: { type: Number, default: 16 },                                   // LoRA 缩放系数（alpha）
    cutoffLen: { type: Number, default: 1024 },                                 // 单条样本截断长度
    quantBits: { type: Number, enum: [4, 8], default: 4 }                        // QLoRA 量化位数
  },
  { _id: false }
)

// 训练指标点：前端据此绘制 loss / 学习率曲线
const metricSchema = new mongoose.Schema(
  {
    step: { type: Number, required: true },  // 当前步数
    epoch: { type: Number, required: true }, // 当前轮次（从 1 开始，保留两位小数）
    loss: { type: Number, required: true },  // 训练损失
    lr: { type: Number, required: true },    // 当前学习率
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },                    // 任务名称
    datasetUrl: { type: String, default: '' },                             // 数据集地址（可选，目录数据集可留空）
    baseModel: { type: String, required: true },                           // 基础模型（如 Qwen2.5-7B）
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed'],                   // 任务状态
      default: 'pending'
    },
    trainingConfig: { type: trainingConfigSchema, default: () => ({}) },    // 训练超参
    progress: { type: Number, default: 0, min: 0, max: 100 },              // 训练进度（百分比）
    currentStep: { type: Number, default: 0 },                             // 已完成步数
    totalSteps: { type: Number, default: 0 },                              // 总步数
    metrics: { type: [metricSchema], default: [] },                        // 指标序列
    logs: { type: String, default: '' },                                   // 任务日志（纯文本，按行追加）
    errorMessage: { type: String, default: '' },                           // 失败原因
    startedAt: { type: Date, default: null },                              // 开始时间
    finishedAt: { type: Date, default: null },                             // 结束时间
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // 创建用户
    isDeleted: { type: Boolean, default: false, index: true }              // 软删除标记（查询默认过滤）
  },
  { timestamps: true }
)

// 列表页常按状态 + 创建时间筛选，建立复合索引
taskSchema.index({ createdBy: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('Task', taskSchema)
