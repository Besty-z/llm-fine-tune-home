// GitHub Star 同步定时任务
// 每天凌晨 2 点（北京时间）批量调用 GitHub API 拉取各项目 Star 数并更新数据库
// 支持：手动触发（管理员接口）、并发限流保护、失败重试、同步记录入库
const cron = require('node-cron')
const axios = require('axios')
const Project = require('../models/Project')
const SyncRecord = require('../models/SyncRecord')
const logger = require('../utils/logger')

// 限流与重试配置
const REQUEST_INTERVAL = 500 // 每个仓库请求间隔（毫秒），避免触发 GitHub 限流
const MAX_RETRY = 2          // 单个仓库失败后最多重试次数
const RETRY_DELAY = 2000     // 重试间隔（毫秒）

// 并发保护标记：同一时间只允许一个同步任务执行
let syncing = false

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 当前是否有同步任务在执行（供触发接口判断） */
const isSyncing = () => syncing

/**
 * 调用 GitHub API 获取单个仓库的 Star 数（带失败重试）
 * @param {string} repo 仓库路径，格式 owner/repo（如 hiyouga/LLaMA-Factory）
 * @returns {Promise<number>} Star 数量
 */
const fetchRepoStars = async (repo) => {
  // 配置 GITHUB_TOKEN 可将限流额度从 60 次/小时提升到 5000 次/小时（可选）
  const headers = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}
  let lastError
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      const { data } = await axios.get(`https://api.github.com/repos/${repo}`, {
        headers,
        timeout: 10000 // 单个请求 10 秒超时，避免卡死整个任务
      })
      return data.stargazers_count
    } catch (error) {
      lastError = error
      // 404 说明仓库不存在或路径错误，重试无意义，直接抛出
      if (error.response && error.response.status === 404) {
        break
      }
      if (attempt < MAX_RETRY) {
        logger.warn(`[syncStar] ${repo} 第 ${attempt + 1} 次请求失败，${RETRY_DELAY}ms 后重试: ${error.message}`)
        await sleep(RETRY_DELAY)
      }
    }
  }
  throw lastError
}

/**
 * 批量更新所有项目的 Star 数（软删除的项目不同步），并将执行记录入库
 * @param {string} triggerType 触发方式：cron / manual
 * @returns {Promise<object|null>} 同步记录；已有任务在执行时返回 null
 */
const syncAllStars = async (triggerType = 'cron') => {
  // 限流保护：并发触发直接拒绝
  if (syncing) {
    logger.warn('[syncStar] 已有同步任务在执行，本次触发被忽略')
    return null
  }
  syncing = true

  // 创建同步记录（running 状态）
  const record = await SyncRecord.create({ triggerType, status: 'running' })
  logger.info(`[syncStar] 开始同步 GitHub Star（${triggerType}），记录ID: ${record._id}`)

  try {
    const projects = await Project.find({ isDeleted: { $ne: true } })
    record.total = projects.length

    for (const project of projects) {
      try {
        project.stars = await fetchRepoStars(project.repo)
        await project.save()
        record.details.push({ repo: project.repo, success: true, stars: project.stars })
        record.successCount += 1
        logger.info(`[syncStar] ${project.repo} -> ${project.stars}`)
      } catch (error) {
        // 单个仓库失败不中断整体任务，记录失败明细
        record.details.push({ repo: project.repo, success: false, message: error.message })
        record.failedCount += 1
        logger.error(`[syncStar] 更新失败 ${project.repo}: ${error.message}`)
      }
      // 请求间隔限流（最后一个仓库后不再等待）
      if (project !== projects[projects.length - 1]) {
        await sleep(REQUEST_INTERVAL)
      }
    }

    // 汇总状态：全部成功 success / 部分失败 partial / 全部失败 failed
    record.status = record.failedCount === 0 ? 'success' : record.successCount > 0 ? 'partial' : 'failed'
    logger.info(`[syncStar] 同步完成，共 ${record.total} 个，成功 ${record.successCount}，失败 ${record.failedCount}`)
  } catch (error) {
    record.status = 'failed'
    record.error = error.message
    logger.error(`[syncStar] 任务执行异常: ${error.message}`)
  } finally {
    record.finishedAt = new Date()
    record.duration = record.finishedAt - record.startedAt
    await record.save()
    syncing = false
  }
  return record
}

/** 注册定时任务：每天 02:00（Asia/Shanghai）执行 */
const startSyncStarJob = () => {
  cron.schedule('0 2 * * *', () => syncAllStars('cron'), { timezone: 'Asia/Shanghai' })
  logger.info('[syncStar] 定时任务已注册（每天 02:00 执行）')
}

// syncAllStars / isSyncing 单独导出，供手动触发接口与测试使用
module.exports = { startSyncStarJob, syncAllStars, isSyncing }
