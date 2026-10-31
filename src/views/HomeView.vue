<template>
  <div class="home">
    <!-- Hero 主视觉区 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">大模型微调技术之家</h1>
        <p class="hero-subtitle">
          专注大语言模型微调技术 · 追踪开源生态 · 沉淀工程实践
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="$router.push('/ranking')">
            浏览开源项目榜单
          </el-button>
          <el-button size="large" round plain class="hero-btn-ghost" @click="$router.push('/tech')">
            了解微调技术
          </el-button>
        </div>
      </div>
    </section>

    <!-- 核心板块入口 -->
    <section class="page-container section-block">
      <div class="page-header">
        <h1>探索内容</h1>
        <p>从技术原理到开源工具，一站式了解大模型微调</p>
      </div>
      <el-row :gutter="20">
        <el-col
          v-for="card in featureCards"
          :key="card.title"
          :xs="24"
          :sm="12"
          :md="6"
          class="card-col"
        >
          <div class="tech-card feature-card" @click="$router.push(card.path)">
            <el-icon :size="36" class="feature-icon">
              <component :is="card.icon" />
            </el-icon>
            <h3>{{ card.title }}</h3>
            <p>{{ card.desc }}</p>
            <span class="feature-link">
              进入 <el-icon><ArrowRight /></el-icon>
            </span>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 数据概览区 -->
    <section class="stats-section">
      <div class="page-container stats-inner">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- 热门项目速览（取榜单前 3） -->
    <section class="page-container section-block">
      <div class="page-header">
        <h1>热门开源项目</h1>
        <p>Star 数领先的大模型微调开源项目</p>
      </div>
      <el-row :gutter="20" v-loading="loading">
        <el-col
          v-for="project in topProjects"
          :key="project.id"
          :xs="24"
          :sm="24"
          :md="8"
          class="card-col"
        >
          <div class="tech-card project-card">
            <div class="project-head">
              <h3>{{ project.name }}</h3>
              <span class="project-stars">
                <el-icon><Star /></el-icon>
                {{ formatStars(project.stars) }}
              </span>
            </div>
            <p class="project-desc">{{ project.description }}</p>
            <el-link
              :href="project.githubUrl"
              target="_blank"
              type="primary"
              :underline="false"
              class="project-link"
            >
              <el-icon><Link /></el-icon> GitHub 仓库
            </el-link>
          </div>
        </el-col>
      </el-row>
      <div class="more-link">
        <el-button text type="primary" @click="$router.push('/ranking')">
          查看完整榜单 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchProjectRanking } from '@/api'

// 板块入口卡片配置
const featureCards = [
  { title: '技术概要', desc: '微调方法体系与技术选型指南', icon: 'Reading', path: '/tech' },
  { title: '开源项目榜单', desc: '微调相关开源项目 Star 排行', icon: 'Trophy', path: '/ranking' },
  { title: '企业介绍', desc: '我们的定位、能力与愿景', icon: 'OfficeBuilding', path: '/enterprise' },
  { title: 'FAQ 问答', desc: '微调常见问题与实践答疑', icon: 'QuestionFilled', path: '/faq' }
]

// 站点数据概览（展示型静态数据）
const stats = [
  { value: '10+', label: '收录开源项目' },
  { value: '6 大', label: '微调技术方向' },
  { value: '定时', label: 'Star 自动更新' },
  { value: '7×24', label: '持续追踪社区' }
]

// 热门项目（取榜单前 3 展示）
const topProjects = ref([])
const loading = ref(false)

/** 格式化 star 数：超过 1000 显示为 x.xk */
const formatStars = (stars) => (stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars))

onMounted(async () => {
  loading.value = true
  try {
    const list = await fetchProjectRanking()
    topProjects.value = list.slice(0, 3)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ===== Hero 区 ===== */
.hero {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: calc(var(--app-navbar-height) + 60px) 20px 80px;
  /* 科技感渐变光晕背景 */
  background:
    radial-gradient(ellipse 60% 50% at 50% 0%, rgba(79, 195, 247, 0.15), transparent),
    var(--app-bg);
}

.hero-title {
  font-size: 44px;
  margin: 0 0 16px;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #4fc3f7, #81d4fa, #e1f5fe);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  font-size: 17px;
  color: var(--app-text-secondary);
  margin: 0 0 36px;
  letter-spacing: 1px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-btn-ghost {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: transparent;
}

/* ===== 通用区块 ===== */
.section-block {
  padding-top: 48px;
  padding-bottom: 48px;
}

.card-col {
  margin-bottom: 20px;
}

/* 功能卡片 */
.feature-card {
  height: 100%;
  cursor: pointer;
  text-align: center;
}

.feature-icon {
  color: var(--app-accent);
  margin-bottom: 12px;
}

.feature-card h3 {
  margin: 8px 0;
  font-size: 17px;
}

.feature-card p {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--app-accent);
}

/* ===== 数据概览条 ===== */
.stats-section {
  background: var(--app-bg-secondary);
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.stats-inner {
  padding-top: 40px;
  padding-bottom: 40px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 30px;
  font-weight: 700;
  color: var(--app-accent);
}

.stat-label {
  font-size: 13px;
  color: var(--app-text-secondary);
}

/* ===== 热门项目卡片 ===== */
.project-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-head h3 {
  margin: 0;
  font-size: 17px;
}

.project-stars {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffd54f;
  font-size: 14px;
  font-weight: 600;
}

.project-desc {
  flex: 1;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.7;
  margin: 0 0 14px;
  /* 超出 3 行省略 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.more-link {
  text-align: center;
  margin-top: 8px;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .hero {
    min-height: 340px;
    padding-bottom: 60px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
