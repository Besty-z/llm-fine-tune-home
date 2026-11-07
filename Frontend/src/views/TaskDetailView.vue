<template>
  <div class="page-container">
    <!-- 顶部：任务标题与操作 -->
    <div class="detail-header">
      <div class="detail-title">
        <el-button link :icon="ArrowLeft" @click="router.push('/tasks')">返回列表</el-button>
        <h1>{{ task.name || '任务详情' }}</h1>
        <el-tag :type="statusMeta.type" effect="dark" size="small">
          {{ statusMeta.label }}
        </el-tag>
      </div>
      <div class="detail-actions">
        <el-button
          v-if="task.status !== 'running'"
          type="primary"
          :loading="acting"
          @click="handleStart"
        >
          {{ task.status === 'pending' ? '启动训练' : '重新训练' }}
        </el-button>
        <el-button v-else type="warning" :loading="acting" @click="handleStop">停止训练</el-button>
        <el-button type="danger" plain :loading="acting" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <!-- 进度与错误信息 -->
    <section class="tech-card progress-card">
      <div class="progress-head">
        <span>训练进度</span>
        <span class="progress-step">
          {{ task.currentStep || 0 }} / {{ task.totalSteps || 0 }} step
        </span>
      </div>
      <el-progress
        :percentage="task.progress || 0"
        :status="task.status === 'failed' ? 'exception' : task.status === 'success' ? 'success' : undefined"
        :stroke-width="16"
        text-inside
      />
      <el-alert
        v-if="task.errorMessage"
        :title="task.errorMessage"
        type="error"
        :closable="false"
        show-icon
        class="error-alert"
      />
    </section>

    <div class="detail-grid">
      <!-- 配置信息 -->
      <section class="tech-card info-card">
        <h3 class="section-title">训练配置</h3>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="基座模型">{{ task.baseModel }}</el-descriptions-item>
          <el-descriptions-item label="微调方法">{{ methodLabel }}</el-descriptions-item>
          <el-descriptions-item label="数据集">{{ datasetLabel }}</el-descriptions-item>
          <el-descriptions-item label="学习率">{{ config.learningRate }}</el-descriptions-item>
          <el-descriptions-item label="训练轮数">{{ config.epochs }} epochs</el-descriptions-item>
          <el-descriptions-item label="批大小">{{ config.batchSize }}</el-descriptions-item>
          <el-descriptions-item label="梯度累积">{{ config.gradientAccumulation }}</el-descriptions-item>
          <el-descriptions-item label="截断长度">{{ config.cutoffLen }}</el-descriptions-item>
          <el-descriptions-item v-if="config.method !== 'full'" label="LoRA r / alpha">
            {{ config.loraRank }} / {{ config.loraAlpha }}
          </el-descriptions-item>
          <el-descriptions-item v-if="config.method === 'qlora'" label="量化位数">
            {{ config.quantBits }}bit
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(task.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatTime(task.finishedAt) }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <!-- 指标曲线 -->
      <section class="tech-card chart-card">
        <div class="chart-head">
          <h3 class="section-title">Loss 曲线</h3>
          <span class="chart-value" v-if="lastLoss !== null">当前 loss：{{ lastLoss.toFixed(4) }}</span>
        </div>
        <MetricChart :points="lossPoints" color="#4fc3f7" :height="200" :precision="3" />

        <h3 class="section-title chart-subtitle">
          学习率曲线
          <span class="chart-value" v-if="lastLr !== null">{{ lastLr.toExponential(2) }}</span>
        </h3>
        <MetricChart :points="lrPoints" color="#26c6da" :height="150" :precision="5" />
      </section>
    </div>

    <!-- 实时日志 -->
    <section class="tech-card log-card">
      <div class="log-head">
        <h3 class="section-title">训练日志</h3>
        <div class="log-tools">
          <el-checkbox v-model="autoScroll">自动滚动</el-checkbox>
          <el-button link :icon="Refresh" @click="pullUpdate">刷新</el-button>
        </div>
      </div>
      <pre ref="logBox" class="log-box">{{ logs || '暂无日志，启动训练后这里会实时输出...' }}</pre>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import MetricChart from '@/components/MetricChart.vue'
import {
  fetchTaskById,
  fetchTaskLogs,
  fetchTaskMetrics,
  startTask,
  stopTask,
  deleteTask
} from '@/api'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id

// 任务详情与实时数据
const task = reactive({})
const logs = ref('')
const metrics = ref([])
const acting = ref(false)
const autoScroll = ref(true)
const logBox = ref(null)

// 轮询状态
const POLL_MS = 1500
let pollTimer = null
let logOffset = 0
let metricSince = 0

// 状态展示配置
const STATUS_MAP = {
  pending: { label: '待启动', type: 'info' },
  running: { label: '训练中', type: 'primary' },
  success: { label: '已完成', type: 'success' },
  failed: { label: '已失败', type: 'danger' }
}

/** 状态展示 */
const statusMeta = computed(() => STATUS_MAP[task.status] || { label: task.status || '未知', type: 'info' })

/** 训练配置兜底 */
const config = computed(() => task.trainingConfig || {})

/** 微调方法中文名 */
const methodLabel = computed(() => ({ lora: 'LoRA', qlora: 'QLoRA', full: '全参微调' }[config.value.method] || 'LoRA'))

/** 数据集展示 */
const datasetLabel = computed(() => config.value.dataset || task.datasetUrl || '自定义数据')

/** loss 曲线数据 */
const lossPoints = computed(() => metrics.value.map((item) => ({ x: item.step, y: item.loss })))

/** 学习率曲线数据 */
const lrPoints = computed(() => metrics.value.map((item) => ({ x: item.step, y: item.lr })))

/** 最新 loss / lr */
const lastLoss = computed(() => (metrics.value.length ? metrics.value[metrics.value.length - 1].loss : null))
const lastLr = computed(() => (metrics.value.length ? metrics.value[metrics.value.length - 1].lr : null))

/** 时间格式化 */
const formatTime = (value) => (value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-')

/** 加载任务基础信息 */
const loadTask = async () => {
  const data = await fetchTaskById(taskId)
  Object.assign(task, data)
}

/** 滚动日志到底部 */
const scrollToBottom = async () => {
  if (!autoScroll.value) return
  await nextTick()
  if (logBox.value) {
    logBox.value.scrollTop = logBox.value.scrollHeight
  }
}

/**
 * 拉取增量日志与指标
 * @returns {Promise<void>}
 */
const pullUpdate = async () => {
  try {
    const [logData, metricData] = await Promise.all([
      fetchTaskLogs(taskId, logOffset),
      fetchTaskMetrics(taskId, metricSince)
    ])
    // 服务端日志被重置（重新训练）时，前端同步清空
    if (logData.reset) {
      logs.value = ''
      metrics.value = []
      metricSince = 0
    }
    if (logData.chunk) {
      logs.value += logData.chunk
      logOffset = logData.offset
    }
    if (metricData.metrics?.length) {
      metrics.value.push(...metricData.metrics)
      metricSince = metrics.value[metrics.value.length - 1].step
    }
    // 同步状态、进度与错误信息
    Object.assign(task, {
      status: logData.status,
      progress: logData.progress,
      currentStep: logData.currentStep,
      totalSteps: logData.totalSteps,
      errorMessage: logData.errorMessage || ''
    })
    await scrollToBottom()
  } catch (error) {
    // 轮询失败不打扰用户，仅在控制台记录
    console.warn('拉取任务状态失败:', error.message)
  }
}

/** 启动（或继续）轮询：仅在训练中轮询，结束后自动停止 */
const schedulePoll = () => {
  clearTimeout(pollTimer)
  if (task.status === 'running') {
    pollTimer = setTimeout(async () => {
      await pullUpdate()
      schedulePoll()
    }, POLL_MS)
  }
}

/** 启动训练 */
const handleStart = async () => {
  acting.value = true
  try {
    await startTask(taskId)
    logs.value = ''
    metrics.value = []
    logOffset = 0
    metricSince = 0
    await loadTask()
    await pullUpdate()
    schedulePoll()
    ElMessage.success('任务已启动')
  } catch (error) {
    ElMessage.error(error.message || '启动失败')
  } finally {
    acting.value = false
  }
}

/** 停止训练 */
const handleStop = async () => {
  try {
    await ElMessageBox.confirm('停止后任务状态将变为失败，确定停止吗？', '停止训练', {
      confirmButtonText: '停止',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  acting.value = true
  try {
    await stopTask(taskId)
    await loadTask()
    await pullUpdate()
    ElMessage.success('任务已停止')
  } catch (error) {
    ElMessage.error(error.message || '停止失败')
  } finally {
    acting.value = false
  }
}

/** 删除任务并返回列表 */
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除任务「${task.name}」吗？`, '删除任务', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  acting.value = true
  try {
    await deleteTask(taskId)
    ElMessage.success('删除成功')
    router.push('/tasks')
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    acting.value = false
  }
}

onMounted(async () => {
  try {
    await loadTask()
    await pullUpdate()
    schedulePoll()
  } catch (error) {
    ElMessage.error(error.message || '任务不存在或无权访问')
    router.replace('/tasks')
  }
})

onUnmounted(() => clearTimeout(pollTimer))
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-title h1 {
  margin: 0;
  font-size: 22px;
  color: var(--app-text);
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.progress-card {
  margin-bottom: 16px;
  padding: 18px 24px;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.progress-step {
  color: var(--app-accent);
}

.error-alert {
  margin-top: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.info-card,
.chart-card {
  padding: 18px 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 15px;
  color: var(--app-accent);
}

.chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.chart-value {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.chart-subtitle {
  margin-top: 18px;
}

.log-card {
  padding: 18px 20px;
}

.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.log-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-box {
  margin: 0;
  height: 320px;
  overflow: auto;
  padding: 14px 16px;
  border-radius: 10px;
  background: #050a1c;
  border: 1px solid var(--app-border);
  color: #a9d8ff;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-actions :deep(.el-button) {
    flex: 1;
  }

  .log-box {
    height: 240px;
  }
}
</style>
