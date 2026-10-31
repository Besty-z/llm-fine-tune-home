// FAQ 模型：问答页内容
const mongoose = require('mongoose')

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true }, // 问题
    answer: { type: String, required: true },   // 答案
    sort: { type: Number, default: 0 },         // 排序值（越小越靠前）
    isDeleted: { type: Boolean, default: false, index: true } // 软删除标记（查询默认过滤）
  },
  { timestamps: true }
)

module.exports = mongoose.model('Faq', faqSchema)
