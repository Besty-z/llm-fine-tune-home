// GitHub Star 同步定时任务
// 每天凌晨 2 点（北京时间）批量调用 GitHub API 拉取各项目 Star 数并更新数据库
// 榜单排序说明：查询接口（getProjects）按 stars 降序返回，本任务只负责刷新数据
const cron = require('node-cron')
const axios = require('axios')
const Project = require('../models/Project')
const logger = require('../utils/logger')

/**
 * 调用 GitHub API 获取单个仓库的 Star 数
 * @param {string} repo 仓库路径，格式 owner/repo（如 hiyouga/LLaMA-Factory）
 * @returns {Promise<number>} Star 数量
 */
const fetchRepoStars = async (repo) => {
  // 配置 GITHUB_TOKEN 可将限流额度从 60 次/小时提升到 5000 次/小时（可选）
  const headers = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}
  const { data } = await axios.get(`https://api.github.com/repos/${repo}`, {
    headers,
    timeout: 10000 // 单个请求 10 秒超时，避免卡死整个任务
  })
  return data.stargazers_count
}

/** 批量更新所有项目的 Star 数（单个失败不中断整体任务；软删除的项目不再同步） */
const syncAllStars = async () => {
  logger.info(`[syncStar] 开始同步 GitHub Star ...`)
  try {
    const projects = await Project.find({ isDeleted: { $ne: true } })
    for (const project of projects) {
      try {
        project.stars = await fetchRepoStars(project.repo)
        await project.save()
        logger.info(`[syncStar] ${project.repo} -> ${project.stars}`)
      } catch (error) {
        logger.error(`[syncStar] 更新失败 ${project.repo}: ${error.message}`)
      }
    }
    logger.info(`[syncStar] 同步完成，共处理 ${projects.length} 个项目`)
  } catch (error) {
    logger.error(`[syncStar] 任务执行异常: ${error.message}`)
  }
}

/** 注册定时任务：每天 02:00（Asia/Shanghai）执行 */
const startSyncStarJob = () => {
  cron.schedule('0 2 * * *', syncAllStars, { timezone: 'Asia/Shanghai' })
  logger.info('[syncStar] 定时任务已注册（每天 02:00 执行）')
}

// syncAllStars 单独导出，便于手动触发测试：node -e "require('./src/schedule/syncStar').syncAllStars()"
module.exports = { startSyncStarJob, syncAllStars }
