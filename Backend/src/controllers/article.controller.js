// 文章控制器：文章增删改查
const Article = require('../models/Article')
const { ok, fail } = require('../utils/resp')

/** 文章列表：按创建时间倒序，支持 category 过滤 */
exports.getArticles = async (req, res) => {
  try {
    const filter = {}
    if (req.query.category) {
      filter.category = req.query.category
    }
    const articles = await Article.find(filter).sort({ createdAt: -1 })
    ok(res, articles)
  } catch (error) {
    fail(res, 500, `查询失败: ${error.message}`)
  }
}

/** 文章详情 */
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    if (!article) {
      return fail(res, 404, '文章不存在')
    }
    ok(res, article)
  } catch (error) {
    fail(res, 500, `查询失败: ${error.message}`)
  }
}

/** 新增文章（管理员） */
exports.createArticle = async (req, res) => {
  try {
    const { title, summary, content, category } = req.body
    if (!title) {
      return fail(res, 400, '文章标题不能为空')
    }
    const article = await Article.create({ title, summary, content, category })
    ok(res, article, '新增成功')
  } catch (error) {
    fail(res, 500, `新增失败: ${error.message}`)
  }
}

/** 更新文章（管理员） */
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!article) {
      return fail(res, 404, '文章不存在')
    }
    ok(res, article, '更新成功')
  } catch (error) {
    fail(res, 500, `更新失败: ${error.message}`)
  }
}

/** 删除文章（管理员） */
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id)
    if (!article) {
      return fail(res, 404, '文章不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    fail(res, 500, `删除失败: ${error.message}`)
  }
}
