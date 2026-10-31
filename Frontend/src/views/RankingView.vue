<template>
  <div class="page-container">
    <div class="page-header">
      <h1>开源项目榜单</h1>
      <p>大模型微调相关开源项目排行 · Star 数据由后端定时调用 GitHub API 更新</p>
    </div>

    <!-- 工具栏：搜索 + 刷新 + 数据说明 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索项目名称或简介..."
        clearable
        :prefix-icon="Search"
        class="toolbar-search"
      />
      <div class="toolbar-right">
        <span v-if="updateTime" class="update-time">更新于 {{ updateTime }}</span>
        <el-button type="primary" plain round :loading="loading" @click="loadData">
          <el-icon style="margin-right: 4px"><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 桌面端：表格视图 -->
    <div class="tech-card table-card desktop-only" v-loading="loading">
      <el-table :data="filteredProjects" style="width: 100%" :default-sort="{ prop: 'stars', order: 'descending' }">
        <!-- 排名列：前三名显示奖杯色 -->
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <span class="rank-badge" :class="rankClass($index)">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="项目名称" min-width="150">
          <template #default="{ row }">
            <span class="project-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="GitHub 地址" min-width="220">
          <template #default="{ row }">
            <el-link :href="row.githubUrl" target="_blank" type="primary" :underline="false" class="github-link">
              <el-icon><Link /></el-icon>
              <span class="github-url">{{ row.githubUrl.replace('https://github.com/', '') }}</span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="简介" min-width="320" show-overflow-tooltip />
        <el-table-column prop="stars" label="Star 数" width="130" sortable align="right">
          <template #default="{ row }">
            <span class="stars-cell">
              <el-icon><Star /></el-icon>
              {{ row.stars.toLocaleString() }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 移动端：卡片列表视图 -->
    <div class="mobile-only" v-loading="loading">
      <div v-for="(project, index) in filteredProjects" :key="project.id" class="tech-card mobile-card">
        <div class="mobile-card-head">
          <span class="rank-badge" :class="rankClass(index)">{{ index + 1 }}</span>
          <span class="project-name">{{ project.name }}</span>
          <span class="stars-cell">
            <el-icon><Star /></el-icon>
            {{ project.stars.toLocaleString() }}
          </span>
        </div>
        <p class="mobile-desc">{{ project.description }}</p>
        <el-link :href="project.githubUrl" target="_blank" type="primary" :underline="false" class="github-link">
          <el-icon><Link /></el-icon>
          <span class="github-url">{{ project.githubUrl.replace('https://github.com/', '') }}</span>
        </el-link>
      </div>
      <el-empty v-if="!loading && filteredProjects.length === 0" description="未找到匹配的项目" />
    </div>

    <!-- 数据更新机制说明 -->
    <el-alert type="info" :closable="false" class="ranking-note">
      <template #title>
        榜单 Star 数据由后端定时任务调用 GitHub API 采集并自动排序，页面展示最近一次采集的快照，非实时数据。
      </template>
    </el-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { fetchProjectRanking } from '@/api'

// 榜单数据与加载状态
const projects = ref([])
const loading = ref(false)
const keyword = ref('')
const updateTime = ref('')

/** 加载榜单数据（模拟后端接口） */
const loadData = async () => {
  loading.value = true
  try {
    projects.value = await fetchProjectRanking()
    // 记录本次数据快照时间
    updateTime.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } finally {
    loading.value = false
  }
}

// 按关键字过滤（名称 + 简介，不区分大小写）
const filteredProjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return projects.value
  return projects.value.filter(
    (p) => p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
  )
})

/** 前三名排名徽标样式 */
const rankClass = (index) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

onMounted(loadData)
</script>

<style scoped>
/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-search {
  max-width: 360px;
  flex: 1;
  min-width: 220px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 12px;
  color: var(--app-text-secondary);
}

/* ===== 排名徽标 ===== */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--app-text-secondary);
  background: rgba(79, 195, 247, 0.08);
}

.rank-1 {
  color: #1a1a1a;
  background: linear-gradient(135deg, #ffd54f, #ffb300);
}

.rank-2 {
  color: #1a1a1a;
  background: linear-gradient(135deg, #e0e0e0, #9e9e9e);
}

.rank-3 {
  color: #1a1a1a;
  background: linear-gradient(135deg, #ffab91, #bf6a4a);
}

/* ===== 表格 ===== */
.table-card {
  padding: 12px;
}

.table-card :deep(.el-table) {
  background: transparent;
}

.project-name {
  font-weight: 600;
  color: var(--app-text);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.github-url {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
}

.stars-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffd54f;
  font-weight: 600;
}

/* ===== 移动端卡片 ===== */
.mobile-card {
  margin-bottom: 14px;
}

.mobile-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.mobile-card-head .project-name {
  flex: 1;
}

.mobile-desc {
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.7;
  margin: 0 0 10px;
}

/* 显隐控制 */
.mobile-only {
  display: none;
}

.ranking-note {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
