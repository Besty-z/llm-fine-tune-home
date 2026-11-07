// 微调目录控制器：返回模型 / 数据集 / 微调方法清单，供前端表单下拉使用
const catalog = require('../config/catalog')
const { ok } = require('../utils/resp')

/**
 * 获取微调目录
 * @param {object} req Express 请求
 * @param {object} res Express 响应
 */
exports.getCatalog = (req, res) => {
  ok(res, catalog)
}
