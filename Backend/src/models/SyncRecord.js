// 同步记录模型：记录每次 GitHub Star 同步的执行情况（定时/手动）
const mongoose = require('mongoose')

// 单个仓库的同步明细
const syncDetailSchema = new mongoose.Schema(
  {
    repo: { type: String, required: true },          // 仓库路径 owner/repo
    success: { type: Boolean, required: true },      // 是否同步成功
    stars: { type: Number, default: 0 },             // 同步到的 Star 数（失败为 0）
    message: { type: String, default: '' }           // 失败原因（成功为空）
  },
  { _id: false } // 明细作为内嵌数组，不生成独立 _id
)

const syncRecordSchema = new mongoose.Schema(
  {
    triggerType: { type: String, enum: ['cron', 'manual'], required: true }, // 触发方式
    status: {
      type: String,
      enum: ['running', 'success', 'partial', 'failed'], // partial：部分仓库失败
      default: 'running'
    },
    total: { type: Number, default: 0 },        // 应同步项目数
    successCount: { type: Number, default: 0 }, // 成功数
    failedCount: { type: Number, default: 0 },  // 失败数
    details: { type: [syncDetailSchema], default: [] }, // 各仓库明细
    error: { type: String, default: '' },       // 整体异常信息（任务级错误）
    startedAt: { type: Date, default: Date.now }, // 开始时间
    finishedAt: { type: Date, default: null },    // 结束时间
    duration: { type: Number, default: 0 }        // 耗时（毫秒）
  },
  { timestamps: true }
)

module.exports = mongoose.model('SyncRecord', syncRecordSchema)
