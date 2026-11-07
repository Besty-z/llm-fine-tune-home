<template>
  <div class="page-container">
    <div class="page-header">
      <h1>管理后台</h1>
      <p>任务管理、内容维护与榜单数据同步（仅管理员可见）</p>
    </div>

    <div class="tech-card admin-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- 任务管理 -->
        <el-tab-pane label="任务管理" name="tasks">
          <div class="toolbar">
            <el-select v-model="taskQuery.status" placeholder="全部状态" clearable style="width: 140px" @change="loadTasks">
              <el-option label="待启动" value="pending" />
              <el-option label="训练中" value="running" />
              <el-option label="已完成" value="success" />
              <el-option label="已失败" value="failed" />
            </el-select>
            <el-input
              v-model="taskQuery.keyword"
              placeholder="搜索任务 / 模型"
              clearable
              style="width: 220px"
              :prefix-icon="Search"
              @keyup.enter="loadTasks"
              @clear="loadTasks"
            />
            <el-button :icon="Refresh" @click="loadTasks">刷新</el-button>
          </div>

          <el-table :data="taskList" v-loading="taskLoading" style="width: 100%" empty-text="暂无任务">
            <el-table-column label="任务名称" min-width="200">
              <template #default="{ row }">
                <router-link :to="`/tasks/${row._id}`" class="link">{{ row.name }}</router-link>
                <div class="sub-text">{{ row.baseModel }}</div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" effect="dark" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="160">
              <template #default="{ row }">
                <el-progress :percentage="row.progress || 0" :stroke-width="8" />
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'running'" type="warning" link @click="handleStop(row)">
                  停止
                </el-button>
                <el-button v-else type="primary" link @click="handleStart(row)">启动</el-button>
                <el-button type="danger" link @click="handleDeleteTask(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="taskQuery.page"
              v-model:page-size="taskQuery.pageSize"
              :total="taskTotal"
              layout="total, prev, pager, next"
              background
              @current-change="loadTasks"
            />
          </div>
        </el-tab-pane>

        <!-- 文章管理 -->
        <el-tab-pane label="文章管理" name="articles" lazy>
          <AdminContentTable v-if="isAdminNow" type="articles" />
        </el-tab-pane>

        <!-- FAQ 管理 -->
        <el-tab-pane label="FAQ 管理" name="faqs" lazy>
          <AdminContentTable v-if="isAdminNow" type="faqs" />
        </el-tab-pane>

        <!-- 广告管理 -->
        <el-tab-pane label="广告管理" name="adverts" lazy>
          <AdminContentTable v-if="isAdminNow" type="adverts" />
        </el-tab-pane>

        <!-- 榜单同步 -->
        <el-tab-pane label="榜单同步" name="sync" lazy>
          <div class="toolbar">
            <el-button type="primary" :loading="syncing" @click="handleSync">立即同步 GitHub Star</el-button>
            <el-button :icon="Refresh" @click="loadSyncRecords">刷新记录</el-button>
            <span class="sub-text">定时任务每天自动同步一次，此处可手动触发</span>
          </div>

          <el-table :data="syncRecords" v-loading="syncLoading" style="width: 100%" empty-text="暂无同步记录">
            <el-table-column label="触发方式" width="110">
              <template #default="{ row }">
                {{ row.triggerType === 'manual' ? '手动' : '定时' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="syncStatusType(row.status)" effect="dark" size="small">
                  {{ syncStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="成功 / 总数" width="120">
              <template #default="{ row }">{{ row.successCount }} / {{ row.total }}</template>
            </el-table-column>
            <el-table-column label="耗时" width="100">
              <template #default="{ row }">{{ row.duration }} ms</template>
            </el-table-column>
            <el-table-column label="开始时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
            </el-table-column>
            <el-table-column prop="error" label="异常信息" min-width="200" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import AdminContentTable from '@/components/AdminContentTable.vue'
import {
  fetchTasks,
  startTask,
  stopTask,
  deleteTask,
  fetchSyncRecords,
  triggerStarSync,
  isAdmin
} from '@/api'

const activeTab = ref('tasks')

// 管理员身份（路由守卫已校验，这里仅用于内页兜底）
const isAdminNow = computed(() => isAdmin())

/* ===== 任务管理 ===== */
const taskLoading = ref(false)
const taskList = ref([])
const taskTotal = ref(0)
const taskQuery = reactive({ page: 1, pageSize: 10, status: '', keyword: '' })

const STATUS_MAP = {
  pending: { label: '待启动', type: 'info' },
  running: { label: '训练中', type: 'primary' },
  success: { label: '已完成', type: 'success' },
  failed: { label: '已失败', type: 'danger' }
}

/** 状态文案 / 颜色 */
const statusLabel = (status) => STATUS_MAP[status]?.label || status
const statusType = (status) => STATUS_MAP[status]?.type || 'info'

/** 时间格式化 */
const formatTime = (value) => (value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-')

/** 加载全部任务（管理员后端自动放开数据范围） */
const loadTasks = async () => {
  taskLoading.value = true
  try {
    const params = { page: taskQuery.page, pageSize: taskQuery.pageSize }
    if (taskQuery.status) params.status = taskQuery.status
    if (taskQuery.keyword.trim()) params.keyword = taskQuery.keyword.trim()
    const data = await fetchTasks(params)
    taskList.value = Array.isArray(data) ? data : data.list || []
    taskTotal.value = Array.isArray(data) ? data.length : data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载任务失败')
  } finally {
    taskLoading.value = false
  }
}

/** 管理员启动任务 */
const handleStart = async (row) => {
  try {
    await startTask(row._id)
    ElMessage.success('任务已启动')
    loadTasks()
  } catch (error) {
    ElMessage.error(error.message || '启动失败')
  }
}

/** 管理员停止任务 */
const handleStop = async (row) => {
  try {
    await stopTask(row._id)
    ElMessage.success('任务已停止')
    loadTasks()
  } catch (error) {
    ElMessage.error(error.message || '停止失败')
  }
}

/** 管理员删除任务 */
const handleDeleteTask = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除任务「${row.name}」吗？`, '删除任务', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await deleteTask(row._id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

/* ===== Star 同步 ===== */
const syncing = ref(false)
const syncLoading = ref(false)
const syncRecords = ref([])

/** 同步记录状态文案 / 颜色 */
const SYNC_MAP = {
  running: { label: '执行中', type: 'warning' },
  success: { label: '成功', type: 'success' },
  partial: { label: '部分成功', type: 'warning' },
  failed: { label: '失败', type: 'danger' }
}
const syncStatusLabel = (status) => SYNC_MAP[status]?.label || status
const syncStatusType = (status) => SYNC_MAP[status]?.type || 'info'

/** 加载同步记录（最近 50 条） */
const loadSyncRecords = async () => {
  syncLoading.value = true
  try {
    const data = await fetchSyncRecords()
    syncRecords.value = Array.isArray(data) ? data : data.list || []
  } catch (error) {
    ElMessage.error(error.message || '加载同步记录失败')
  } finally {
    syncLoading.value = false
  }
}

/** 手动触发同步 */
const handleSync = async () => {
  syncing.value = true
  try {
    const record = await triggerStarSync()
    ElMessage.success(`同步完成：成功 ${record.successCount}/${record.total}`)
    loadSyncRecords()
  } catch (error) {
    ElMessage.error(error.message || '同步失败')
  } finally {
    syncing.value = false
  }
}

/** 切换标签页时按需加载 */
const onTabChange = (name) => {
  if (name === 'tasks') loadTasks()
  if (name === 'sync') loadSyncRecords()
}

onMounted(loadTasks)
</script>

<style scoped>
.admin-card {
  padding: 8px 24px 24px;
}

.admin-card:hover {
  transform: none;
  box-shadow: none;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.link {
  color: var(--app-text);
}

.link:hover {
  color: var(--app-accent);
}

.sub-text {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

@media (max-width: 768px) {
  .admin-card {
    padding: 4px 12px 16px;
  }
}
</style>
