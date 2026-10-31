// FAQ 控制器：问答增删改查（软删除 + 可选分页）
const Faq = require('../models/Faq')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')

const DEFAULT_SORT = { sort: 1, createdAt: -1 } // 排序值小的靠前，相同则新的靠前

/** FAQ 列表：携带 page/pageSize/keyword 时返回分页结构，否则返回数组（前端 FAQ 页数据源） */
exports.getFaqs = async (req, res, next) => {
  try {
    // 兼容旧契约：不带分页参数时直接返回数组
    if (!isPageRequest(req.query)) {
      const faqs = await Faq.find({ isDeleted: { $ne: true } }).sort(DEFAULT_SORT)
      return ok(res, faqs)
    }
    const result = await paginate(Faq, {
      query: req.query,
      searchFields: ['question', 'answer'],
      sort: DEFAULT_SORT
    })
    ok(res, result)
  } catch (error) {
    next(error)
  }
}

/** 新增 FAQ（管理员） */
exports.createFaq = async (req, res, next) => {
  try {
    const { question, answer, sort } = req.body
    const faq = await Faq.create({ question, answer, sort })
    ok(res, faq, '新增成功')
  } catch (error) {
    next(error)
  }
}

/** 更新 FAQ（管理员，软删除的数据不可更新） */
exports.updateFaq = async (req, res, next) => {
  try {
    const faq = await Faq.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true }
    )
    if (!faq) {
      throw ApiError.notFound('FAQ 不存在')
    }
    ok(res, faq, '更新成功')
  } catch (error) {
    next(error)
  }
}

/** 删除 FAQ（管理员，软删除：仅标记 isDeleted，数据可恢复） */
exports.deleteFaq = async (req, res, next) => {
  try {
    const faq = await Faq.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    )
    if (!faq) {
      throw ApiError.notFound('FAQ 不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
