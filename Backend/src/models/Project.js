// 开源项目模型：榜单数据源，Star 数由定时任务更新
const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // 项目名称
    githubUrl: { type: String, required: true },                      // GitHub 仓库地址
    repo: { type: String, required: true },                           // 仓库路径（owner/repo），定时任务调用 API 使用
    description: { type: String, default: '' },                       // 项目简介
    stars: { type: Number, default: 0 }                               // Star 数量
  },
  { timestamps: true }
)

module.exports = mongoose.model('Project', projectSchema)
