// 文章模型：技术文章 / 企业介绍等内容载体
const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },              // 标题
    summary: { type: String, default: '' },               // 摘要
    content: { type: String, default: '' },               // 正文（Markdown）
    category: { type: String, default: 'tech' },          // 分类：tech / enterprise 等
    published: { type: Boolean, default: true }           // 是否发布
  },
  { timestamps: true }
)

module.exports = mongoose.model('Article', articleSchema)
