// FAQ 控制器：问答增删改查
const Faq = require('../models/Faq')
const { ok, fail } = require('../utils/resp')

/** FAQ 列表：按 sort 升序（前端 FAQ 页数据源） */
exports.getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ sort: 1, createdAt: -1 })
    ok(res, faqs)
  } catch (error) {
    fail(res, 500, `查询失败: ${error.message}`)
  }
}

/** 新增 FAQ（管理员） */
exports.createFaq = async (req, res) => {
  try {
    const { question, answer, sort } = req.body
    if (!question || !answer) {
      return fail(res, 400, '问题和答案不能为空')
    }
    const faq = await Faq.create({ question, answer, sort })
    ok(res, faq, '新增成功')
  } catch (error) {
    fail(res, 500, `新增失败: ${error.message}`)
  }
}

/** 更新 FAQ（管理员） */
exports.updateFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!faq) {
      return fail(res, 404, 'FAQ 不存在')
    }
    ok(res, faq, '更新成功')
  } catch (error) {
    fail(res, 500, `更新失败: ${error.message}`)
  }
}

/** 删除 FAQ（管理员） */
exports.deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id)
    if (!faq) {
      return fail(res, 404, 'FAQ 不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    fail(res, 500, `删除失败: ${error.message}`)
  }
}
