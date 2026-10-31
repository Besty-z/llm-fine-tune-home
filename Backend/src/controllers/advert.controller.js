// 广告控制器：广告位增删改查（软删除 + 可选分页）
const Advert = require('../models/Advert')
const ApiError = require('../utils/apiError')
const { ok } = require('../utils/resp')
const { paginate, isPageRequest } = require('../utils/pagination')

const DEFAULT_SORT = { sort: 1, createdAt: -1 } // 排序值小的靠前，相同则新的靠前

/** 广告列表：仅返回启用中的广告，支持 position 过滤；携带分页参数时返回分页结构 */
exports.getAdverts = async (req, res, next) => {
  try {
    const filter = { enabled: true }
    if (req.query.position) {
      filter.position = req.query.position
    }
    // 兼容旧契约：不带分页参数时直接返回数组
    if (!isPageRequest(req.query)) {
      const adverts = await Advert.find({ ...filter, isDeleted: { $ne: true } }).sort(DEFAULT_SORT)
      return ok(res, adverts)
    }
    const result = await paginate(Advert, {
      query: req.query,
      filter,
      searchFields: ['title'],
      sort: DEFAULT_SORT
    })
    ok(res, result)
  } catch (error) {
    next(error)
  }
}

/** 新增广告（管理员） */
exports.createAdvert = async (req, res, next) => {
  try {
    const { title, imageUrl, linkUrl, position, sort } = req.body
    const advert = await Advert.create({ title, imageUrl, linkUrl, position, sort })
    ok(res, advert, '新增成功')
  } catch (error) {
    next(error)
  }
}

/** 更新广告（管理员，软删除的数据不可更新） */
exports.updateAdvert = async (req, res, next) => {
  try {
    const advert = await Advert.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true }
    )
    if (!advert) {
      throw ApiError.notFound('广告不存在')
    }
    ok(res, advert, '更新成功')
  } catch (error) {
    next(error)
  }
}

/** 删除广告（管理员，软删除：仅标记 isDeleted，数据可恢复） */
exports.deleteAdvert = async (req, res, next) => {
  try {
    const advert = await Advert.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    )
    if (!advert) {
      throw ApiError.notFound('广告不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    next(error)
  }
}
