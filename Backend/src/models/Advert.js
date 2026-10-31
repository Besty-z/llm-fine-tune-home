// 广告模型：站点 Banner / 推广位
const mongoose = require('mongoose')

const advertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },        // 广告标题
    imageUrl: { type: String, default: '' },        // 图片地址
    linkUrl: { type: String, default: '' },         // 点击跳转地址
    position: { type: String, default: 'home' },    // 投放位置：home / sidebar 等
    sort: { type: Number, default: 0 },             // 排序值
    enabled: { type: Boolean, default: true },      // 是否启用
    isDeleted: { type: Boolean, default: false, index: true } // 软删除标记（查询默认过滤）
  },
  { timestamps: true }
)

module.exports = mongoose.model('Advert', advertSchema)
