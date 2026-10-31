// 文章控制器：文章增删改查（软删除 + 可选分页）
const Article = require('../models/Article')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')

/** 文章列表：按创建时间倒序，支持 category 过滤；携带分页参数时返回分页结构 */
exports.getArticles = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.category) {
      filter.category = req.query.category
    }
    // 兼容旧契约：不带分页参数时直接返回数组
    if (!isPageRequest(req.query)) {
      const articles = await Article.find({ ...filter, isDeleted: { $ne: true } }).sort({ createdAt: -1 })
      return ok(res, articles)
    }
    const result = await paginate(Article, {
      query: req.query,
      filter,
      searchFields: ['title', 'summary']
    })
    ok(res, result)
  } catch (error) {
    next(error)
  }
}

/** 文章详情（软删除的数据不可见） */
exports.getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    if (!article) {
      throw ApiError.notFound('文章不存在')
    }
    ok(res, article)
  } catch (error) {
    next(error)
  }
}

/** 新增文章（管理员） */
exports.createArticle = async (req, res, next) => {
  try {
    const { title, summary, content, category } = req.body
    const article = await Article.create({ title, summary, content, category })
    ok(res, article, '新增成功')
  } catch (error) {
    next(error)
  }
}

/** 更新文章（管理员，软删除的数据不可更新） */
exports.updateArticle = async (req, res, next) => {
  try {
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true }
    )
    if (!article) {
      throw ApiError.notFound('文章不存在')
    }
    ok(res, article, '更新成功')
  } catch (error) {
    next(error)
  }
}

/** 删除文章（管理员，软删除：仅标记 isDeleted，数据可恢复） */
exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    )
    if (!article) {
      throw ApiError.notFound('文章不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
