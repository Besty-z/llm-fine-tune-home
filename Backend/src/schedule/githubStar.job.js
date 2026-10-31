// GitHub Star 定时更新任务（模板）
// 每天凌晨 2 点（北京时间）遍历 Project 集合，调用 GitHub API 刷新 Star 数
const cron = require('node-cron')
const axios = require('axios')
const Project = require('../models/Project')

/**
 * 调用 GitHub API 获取单个仓库的 Star 数
 * @param {string} repo 仓库路径，格式 owner/repo（如 hiyouga/LLaMA-Factory）
 * @returns {Promise<number>} Star 数量
 */
const fetchRepoStars = async (repo) => {
  // 配置 GITHUB_TOKEN 可提升限流额度（可选）
  const headers = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}
  const { data } = await axios.get(`https://api.github.com/repos/${repo}`, { headers })
  return data.stargazers_count
}

/** 遍历项目集合并更新 Star 数 */
const updateAllStars = async () => {
  console.log('[定时任务] 开始更新 GitHub Star ...')
  const projects = await Project.find()
  for (const project of projects) {
    try {
      // TODO: 确认项目记录的 repo 字段格式为 owner/repo
      project.stars = await fetchRepoStars(project.repo)
      await project.save()
      console.log(`[定时任务] ${project.repo} -> ${project.stars}`)
    } catch (error) {
      // 单个仓库失败不中断整体任务
      console.error(`[定时任务] 更新失败 ${project.repo}: ${error.message}`)
    }
  }
  console.log('[定时任务] GitHub Star 更新完成')
}

/** 注册定时任务：每天 02:00（Asia/Shanghai）执行 */
const startGithubStarJob = () => {
  cron.schedule('0 2 * * *', updateAllStars, { timezone: 'Asia/Shanghai' })
  console.log('[定时任务] GitHub Star 任务已注册（每天 02:00 执行）')
}

module.exports = { startGithubStarJob, updateAllStars }
