<template>
  <div class="page-container">
    <div class="page-header">
      <h1>微调工作台</h1>
      <p>配置模型与超参，一键启动训练并实时查看进度、日志与损失曲线</p>
    </div>

    <!-- 工具栏：状态筛选 + 关键词搜索 + 新建任务 -->
    <div class="toolbar tech-card">
      <div class="toolbar-left">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="reload">
          <el-option label="待启动" value="pending" />
          <el-option label="训练中" value="running" />
          <el-option label="已完成" value="success" />
          <el-option label="已失败" value="failed" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="搜索任务名称 / 模型"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="reload"
          @clear="reload"
        />
        <el-button type="primary" plain @click="reload">查询</el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="goCreate">新建微调任务</el-button>
    </div>

    <!-- 任务列表 -->
    <div class="tech-card table-card" v-loading="loading">
      <el-table :data="tasks" style="width: 100%" empty-text="还没有任务，先新建一个吧">
        <el-table-column label="任务名称" min-width="200">
          <template #default="{ row }">
            <router-link :to="`/tasks/${row._id}`" class="task-name">{{ row.name }}</router-link>
            <div class="task-sub">{{ methodLabel(row.trainingConfig?.method) }} · {{ row.baseModel }}</div>
          </template>
        </el-table-column>

        <el-table-column label="数据集" min-width="150">
          <template #default="{ row }">
            {{ datasetLabel(row) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" effect="dark" size="small">
              {{ statusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="进度" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress || 0"
              :status="row.status === 'failed' ? 'exception' : row.status === 'success' ? 'success' : undefined"
              :stroke-width="10"
            />
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'running'"
              type="primary"
              link
              :loading="actionId === row._id"
              @click="handleStart(row)"
            >
              {{ row.status === 'pending' ? '启动' : '重新训练' }}
            </el-button>
            <el-button v-else type="warning" link :loading="actionId === row._id" @click="handleStop(row)">
              停止
            </el-button>
            <el-button type="primary" link @click="goDetail(row)">详情</el-button>
            <el-button type="danger" link :loading="actionId === row._id" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadTasks"
          @size-change="reload"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { fetchTasks, startTask, stopTask, deleteTask } from '@/api'

const router = useRouter()
const loading = ref(false)
const actionId = ref('')
const tasks = ref([])
const total = ref(0)

// 查询条件（携带分页参数时后端返回分页结构）
const query = reactive({ page: 1, pageSize: 10, status: '', keyword: '' })

/** 状态展示配置 */
const STATUS_MAP = {
  pending: { label: '待启动', type: 'info' },
  running: { label: '训练中', type: 'primary' },
  success: { label: '已完成', type: 'success' },
  failed: { label: '已失败', type: 'danger' }
}

/** 获取状态展示配置 */
const statusMeta = (status) => STATUS_MAP[status] || { label: status, type: 'info' }

/** 微调方法中文名 */
const methodLabel = (method) => ({ lora: 'LoRA', qlora: 'QLoRA', full: '全参微调' }[method] || 'LoRA')

/** 数据集展示：优先使用目录数据集标识，其次落到自定义地址 */
const datasetLabel = (row) => row.trainingConfig?.dataset || row.datasetUrl || '自定义数据'

/** 时间格式化 */
const formatTime = (value) => (value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-')

/** 加载任务列表 */
const loadTasks = async () => {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.status) params.status = query.status
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    const data = await fetchTasks(params)
    tasks.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载任务失败')
  } finally {
    loading.value = false
  }
}

/** 重置到第一页并重新查询 */
const reload = () => {
  query.page = 1
  loadTasks()
}

/** 新建任务 */
const goCreate = () => router.push('/tasks/create')

/** 进入任务详情 */
const goDetail = (row) => router.push(`/tasks/${row._id}`)

/** 启动训练 */
const handleStart = async (row) => {
  actionId.value = row._id
  try {
    await startTask(row._id)
    ElMessage.success('任务已启动，正在进入训练队列')
    loadTasks()
  } catch (error) {
    ElMessage.error(error.message || '启动失败')
  } finally {
    actionId.value = ''
  }
}

/** 停止训练 */
const handleStop = async (row) => {
  try {
    await ElMessageBox.confirm('停止后任务状态将变为失败，确定停止该任务吗？', '停止训练', {
      confirmButtonText: '停止',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  actionId.value = row._id
  try {
    await stopTask(row._id)
    ElMessage.success('任务已停止')
    loadTasks()
  } catch (error) {
    ElMessage.error(error.message || '停止失败')
  } finally {
    actionId.value = ''
  }
}

/** 删除任务（软删除） */
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除任务「${row.name}」吗？`, '删除任务', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  actionId.value = row._id
  try {
    await deleteTask(row._id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    actionId.value = ''
  }
}

onMounted(loadTasks)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.table-card {
  padding: 16px 20px 8px;
}

.task-name {
  color: var(--app-text);
  font-weight: 500;
}

.task-name:hover {
  color: var(--app-accent);
}

.task-sub {
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-top: 2px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar :deep(.el-select),
  .toolbar :deep(.el-input) {
    width: 100% !important;
  }

  .table-card {
    padding: 12px;
  }
}
</style>
