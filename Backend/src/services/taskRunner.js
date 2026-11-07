// 模拟训练执行器：以定时器逐步推进任务进度，写入日志与 loss / 学习率指标
// 设计目标：无 GPU 环境也能完整体验「启动 -> 训练中 -> 成功 / 失败」的任务闭环
const Task = require('../models/Task')
const ApiError = require('../utils/apiError')
const logger = require('../utils/logger')

// 每个 step 的间隔（毫秒），演示环境默认 1.5 秒，可通过环境变量覆盖
const TICK_MS = Math.max(parseInt(process.env.TASK_TICK_MS, 10) || 1500, 300)
// 每轮（epoch）的模拟步数，总步数 = epochs * STEPS_PER_EPOCH（上限 120，避免任务过长）
const STEPS_PER_EPOCH = 12
const MAX_TOTAL_STEPS = 120
// 日志长度上限，防止任务长时间运行导致文档无限膨胀
const MAX_LOG_LENGTH = 20000

// 运行中的任务会话：taskId -> { timer, step, totalSteps, logs, loss, config }
const sessions = new Map()

/**
 * 计算模拟的总步数
 * @param {object} config 训练配置
 * @returns {number} 总步数
 */
const totalStepsOf = (config = {}) => {
  const epochs = Number(config.epochs) || 3
  return Math.min(Math.max(Math.round(epochs * STEPS_PER_EPOCH), STEPS_PER_EPOCH), MAX_TOTAL_STEPS)
}

/**
 * 生成模拟训练损失：随进度指数衰减，并叠加小幅随机噪声
 * @param {number} step 当前步数
 * @param {number} totalSteps 总步数
 * @returns {number} 损失值
 */
const lossOf = (step, totalSteps) => {
  const ratio = Math.min(step / totalSteps, 1)
  const base = 0.62 + 1.68 * Math.exp(-3.2 * ratio)
  const noise = (Math.random() - 0.5) * 0.06
  return Number(Math.max(base + noise, 0.05).toFixed(4))
}

/**
 * 生成模拟学习率：前 5% 步数线性预热，之后余弦衰减
 * @param {number} step 当前步数
 * @param {number} totalSteps 总步数
 * @param {number} peakLr 峰值学习率
 * @returns {number} 学习率
 */
const lrOf = (step, totalSteps, peakLr) => {
  const ratio = Math.min(step / totalSteps, 1)
  const warmup = 0.05
  if (ratio < warmup) {
    return Number((peakLr * (ratio / warmup)).toPrecision(3))
  }
  const progress = (ratio - warmup) / (1 - warmup)
  const decayed = peakLr * 0.5 * (1 + Math.cos(Math.PI * progress))
  return Number(Math.max(decayed, peakLr * 0.02).toPrecision(3))
}

/**
 * 拼接一行带时间戳的日志
 * @param {string} line 日志内容
 * @returns {string} 格式化后的日志行
 */
const logLine = (line) => {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  return `[${time}] ${line}\n`
}

/**
 * 追加日志并做长度截断（保留尾部内容）
 * @param {string} logs 原日志
 * @param {string} addition 追加内容
 * @returns {string} 新日志
 */
const appendLog = (logs, addition) => {
  const merged = logs + addition
  return merged.length > MAX_LOG_LENGTH ? merged.slice(merged.length - MAX_LOG_LENGTH) : merged
}

/** 清理会话定时器并从运行表移除 */
const disposeSession = (taskId) => {
  const session = sessions.get(taskId)
  if (session?.timer) {
    clearInterval(session.timer)
  }
  sessions.delete(taskId)
}

/**
 * 启动任务：重置指标与日志，按定时器逐步推进
 * @param {object} task Mongoose 任务文档
 * @returns {Promise<object>} 启动后的任务文档
 * @throws {ApiError} 任务状态不允许启动时抛出 400
 */
exports.startTask = async (task) => {
  const taskId = String(task._id)
  if (sessions.has(taskId)) {
    throw ApiError.badRequest('任务已在运行中')
  }
  if (task.status === 'running') {
    throw ApiError.badRequest('任务已在运行中')
  }

  const config = {
    method: task.trainingConfig?.method || 'lora',
    dataset: task.trainingConfig?.dataset || '',
    learningRate: Number(task.trainingConfig?.learningRate) || 2e-4,
    epochs: Number(task.trainingConfig?.epochs) || 3,
    batchSize: Number(task.trainingConfig?.batchSize) || 4,
    gradientAccumulation: Number(task.trainingConfig?.gradientAccumulation) || 4,
    loraRank: Number(task.trainingConfig?.loraRank) || 8,
    loraAlpha: Number(task.trainingConfig?.loraAlpha) || 16,
    cutoffLen: Number(task.trainingConfig?.cutoffLen) || 1024,
    quantBits: Number(task.trainingConfig?.quantBits) || 4
  }
  const totalSteps = totalStepsOf(config)
  const methodLabel = { lora: 'LoRA', qlora: 'QLoRA', full: '全参微调' }[config.method] || 'LoRA'

  const headLogs =
    logLine(`加载基座模型：${task.baseModel}`) +
    logLine(`微调方法：${methodLabel}｜数据集：${config.dataset || task.datasetUrl || '自定义数据'}`) +
    logLine(
      `训练参数：epochs=${config.epochs} batch_size=${config.batchSize} grad_accum=${config.gradientAccumulation} lr=${config.learningRate}`
    ) +
    (config.method === 'qlora' ? logLine(`量化配置：${config.quantBits}bit 双重量化已启用`) : '') +
    logLine(`可训练参数占比约 ${config.method === 'full' ? '100' : '0.06'}%｜总步数：${totalSteps}`) +
    logLine('开始训练 ...')

  // 先落库「运行中」状态，保证前端立刻看到状态变化
  await Task.updateOne(
    { _id: task._id },
    {
      $set: {
        status: 'running',
        progress: 0,
        currentStep: 0,
        totalSteps,
        metrics: [],
        logs: headLogs,
        errorMessage: '',
        startedAt: new Date(),
        finishedAt: null
      }
    }
  )

  const session = { timer: null, step: 0, totalSteps, logs: headLogs, loss: 2.3, config }
  sessions.set(taskId, session)
  logger.info(`任务已启动: ${task.name} (${taskId})`)

  session.timer = setInterval(() => tick(taskId, task.baseModel), TICK_MS)

  return Task.findById(task._id)
}

/**
 * 单步推进任务：生成指标 -> 写库 -> 判断收敛 / 失败 / 完成
 * @param {string} taskId 任务 ID
 * @param {string} baseModel 基座模型名（用于模拟显存不足）
 */
const tick = async (taskId, baseModel) => {
  const session = sessions.get(taskId)
  if (!session) return

  session.step += 1
  const { step, totalSteps, config } = session
  const epoch = Number((step / (totalSteps / config.epochs || 1)).toFixed(2))
  const loss = lossOf(step, totalSteps)
  const lr = lrOf(step, totalSteps, config.learningRate)
  session.loss = loss
  const progress = Math.min(Math.round((step / totalSteps) * 100), 100)
  const line = logLine(
    `step ${step}/${totalSteps} · epoch ${epoch} · loss ${loss.toFixed(4)} · lr ${lr.toExponential(2)} · grad_norm ${(Math.random() * 0.6 + 0.2).toFixed(3)}`
  )
  session.logs = appendLog(session.logs, line)

  // 模拟真实约束：大模型全参微调在中途显存溢出（可稳定复现 failed 状态）
  const isOomRisk = config.method === 'full' && /(13B|14B|70B|16B)/i.test(baseModel)
  if (isOomRisk && progress >= 30) {
    const reason = `CUDA out of memory：${baseModel} 全参微调超出显存，建议改用 QLoRA 或减小 batch_size`
    session.logs = appendLog(session.logs, logLine(`训练异常终止：${reason}`))
    await persist(taskId, session, {
      status: 'failed',
      errorMessage: reason,
      finishedAt: new Date(),
      progress
    })
    disposeSession(taskId)
    logger.warn(`任务失败(模拟OOM): ${taskId}`)
    return
  }

  const isFinished = step >= totalSteps
  if (isFinished) {
    const finalLog =
      logLine('保存 LoRA 权重与 tokenizer ...') +
      logLine(`训练完成：共 ${totalSteps} 步，最终 loss ${loss.toFixed(4)}`)
    session.logs = appendLog(session.logs, finalLog)
    await persist(taskId, session, {
      status: 'success',
      progress: 100,
      finishedAt: new Date()
    })
    disposeSession(taskId)
    logger.info(`任务完成: ${taskId}`)
    return
  }

  await persist(taskId, session, { progress })
}

/**
 * 将当前会话状态写库（仅当任务仍处于 running，避免覆盖手动停止后的状态）
 * @param {string} taskId 任务 ID
 * @param {object} session 会话
 * @param {object} extra 额外的 $set 字段（进度、状态、结束时间等）
 */
const persist = async (taskId, session, extra = {}) => {
  const { step, totalSteps, config, logs, loss } = session
  await Task.updateOne(
    { _id: taskId, status: 'running' },
    {
      $set: {
        currentStep: step,
        totalSteps,
        logs,
        ...extra
      },
      $push: {
        metrics: {
          step,
          epoch: Number((step / (totalSteps / config.epochs || 1)).toFixed(2)),
          loss,
          lr: lrOf(step, totalSteps, config.learningRate),
          createdAt: new Date()
        }
      }
    }
  )
}

/**
 * 停止任务：中断定时器，状态置为 failed 并记录原因
 * @param {object} task Mongoose 任务文档
 * @param {string} [reason] 停止原因
 * @returns {Promise<object>} 停止后的任务文档
 * @throws {ApiError} 任务未在运行时抛出 400
 */
exports.stopTask = async (task, reason = '用户手动停止训练') => {
  const taskId = String(task._id)
  const session = sessions.get(taskId)
  if (!session) {
    throw ApiError.badRequest('任务当前没有在运行')
  }
  disposeSession(taskId)
  const logs = appendLog(session.logs, logLine(`训练已停止：${reason}`))
  await Task.updateOne(
    { _id: task._id },
    {
      $set: {
        status: 'failed',
        errorMessage: reason,
        logs,
        finishedAt: new Date()
      }
    }
  )
  logger.warn(`任务已停止: ${taskId}`)
  return Task.findById(task._id)
}

/**
 * 服务启动时恢复中断任务：进程重启后运行中的任务一律置为 failed
 * @returns {Promise<number>} 被处理的任数据量
 */
exports.recoverInterrupted = async () => {
  const result = await Task.updateMany(
    { status: 'running', isDeleted: { $ne: true } },
    {
      $set: {
        status: 'failed',
        errorMessage: '服务重启，训练进程已中断，请重新启动任务',
        finishedAt: new Date()
      }
    }
  )
  if (result.modifiedCount > 0) {
    logger.warn(`检测到 ${result.modifiedCount} 个中断任务，已标记为 failed`)
  }
  return result.modifiedCount
}

/**
 * 查询任务是否正在模拟运行
 * @param {string} taskId 任务 ID
 * @returns {boolean}
 */
exports.isRunning = (taskId) => sessions.has(String(taskId))
