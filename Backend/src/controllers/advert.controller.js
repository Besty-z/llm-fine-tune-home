// 广告控制器：广告位增删改查
const Advert = require('../models/Advert')
const { ok, fail } = require('../utils/resp')

/** 广告列表：仅返回启用中的广告，支持 position 过滤 */
exports.getAdverts = async (req, res) => {
  try {
    const filter = { enabled: true }
    if (req.query.position) {
      filter.position = req.query.position
    }
    const adverts = await Advert.find(filter).sort({ sort: 1 })
    ok(res, adverts)
  } catch (error) {
    fail(res, 500, `查询失败: ${error.message}`)
  }
}

/** 新增广告（管理员） */
exports.createAdvert = async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, position, sort } = req.body
    if (!title) {
      return fail(res, 400, '广告标题不能为空')
    }
    const advert = await Advert.create({ title, imageUrl, linkUrl, position, sort })
    ok(res, advert, '新增成功')
  } catch (error) {
    fail(res, 500, `新增失败: ${error.message}`)
  }
}

/** 更新广告（管理员） */
exports.updateAdvert = async (req, res) => {
  try {
    const advert = await Advert.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!advert) {
      return fail(res, 404, '广告不存在')
    }
    ok(res, advert, '更新成功')
  } catch (error) {
    fail(res, 500, `更新失败: ${error.message}`)
  }
}

/** 删除广告（管理员） */
exports.deleteAdvert = async (req, res) => {
  try {
    const advert = await Advert.findByIdAndDelete(req.params.id)
    if (!advert) {
      return fail(res, 404, '广告不存在')
    }
    ok(res, null, '删除成功')
  } catch (error) {
    fail(res, 500, `删除失败: ${error.message}`)
  }
}
