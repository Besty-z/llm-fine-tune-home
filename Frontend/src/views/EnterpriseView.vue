<template>
  <div class="page-container">
    <div class="page-header">
      <h1>企业介绍</h1>
      <p>让大模型微调技术触手可及</p>
    </div>

    <!-- 关于我们 -->
    <section class="section">
      <div class="tech-card about-card">
        <h2 class="section-title">
          <el-icon><OfficeBuilding /></el-icon> 关于我们
        </h2>
        <p>
          「大模型微调技术之家」是一个专注于大语言模型微调领域的技术社区与知识平台。我们持续跟踪全球微调技术演进，
          系统整理全参数微调、LoRA、QLoRA、偏好对齐等方法论的工程实践，维护微调开源项目榜单，帮助开发者与企业
          降低大模型落地的技术门槛。
        </p>
        <p>
          我们相信：微调是让通用大模型真正服务于行业场景的关键一步。通过沉淀高质量的技术内容与工具评测，
          我们希望成为连接开源社区与产业应用的桥梁。
        </p>
      </div>
    </section>

    <!-- 核心能力 -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><MagicStick /></el-icon> 核心能力
      </h2>
      <el-row :gutter="20">
        <el-col
          v-for="capability in capabilities"
          :key="capability.title"
          :xs="24"
          :sm="12"
          :md="6"
          class="card-col"
        >
          <div class="tech-card capability-card">
            <el-icon :size="32" class="capability-icon">
              <component :is="capability.icon" />
            </el-icon>
            <h3>{{ capability.title }}</h3>
            <p>{{ capability.desc }}</p>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 发展里程碑 -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><Flag /></el-icon> 发展里程碑
      </h2>
      <div class="tech-card">
        <el-timeline class="milestone-timeline">
          <el-timeline-item
            v-for="milestone in milestones"
            :key="milestone.time"
            :timestamp="milestone.time"
            placement="top"
            :type="milestone.type"
          >
            <h4 class="milestone-title">{{ milestone.title }}</h4>
            <p class="milestone-desc">{{ milestone.desc }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </section>

    <!-- 联系我们 -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><Message /></el-icon> 联系我们
      </h2>
      <el-row :gutter="20">
        <el-col
          v-for="contact in contacts"
          :key="contact.label"
          :xs="24"
          :sm="12"
          :md="8"
          class="card-col"
        >
          <div class="tech-card contact-card">
            <el-icon :size="24" class="contact-icon">
              <component :is="contact.icon" />
            </el-icon>
            <div>
              <div class="contact-label">{{ contact.label }}</div>
              <div class="contact-value">{{ contact.value }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup>
// 核心能力
const capabilities = [
  { title: '技术内容沉淀', desc: '系统化微调方法论与最佳实践文档', icon: 'Collection' },
  { title: '开源项目评测', desc: '主流微调框架横向对比与选型建议', icon: 'DataAnalysis' },
  { title: '榜单数据服务', desc: 'GitHub Star 定时采集与排行数据', icon: 'TrendCharts' },
  { title: '社区问答交流', desc: '微调实践问题的答疑与经验分享', icon: 'ChatDotRound' }
]

// 发展里程碑
const milestones = [
  { time: '2024 Q1', title: '平台上线', desc: '「大模型微调技术之家」正式发布，首批上线技术概要与 FAQ 板块。', type: 'primary' },
  { time: '2024 Q3', title: '开源榜单发布', desc: '推出微调开源项目榜单，Star 数据由后端定时调用 GitHub API 自动更新排序。', type: 'success' },
  { time: '2025 Q1', title: '内容体系完善', desc: '覆盖全参微调、PEFT、偏好对齐等技术方向，形成完整知识体系。', type: 'warning' },
  { time: '2025 至今', title: '持续迭代中', desc: '追踪社区最新进展，持续更新榜单与内容，服务更多开发者。', type: 'info' }
]

// 联系方式
const contacts = [
  { label: '商务合作', value: 'contact@llmft.example.com', icon: 'Message' },
  { label: '技术交流', value: 'GitHub Discussions 社区', icon: 'ChatDotRound' },
  { label: '内容投稿', value: 'submit@llmft.example.com', icon: 'Promotion' }
]
</script>

<style scoped>
.section {
  margin-bottom: 48px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  margin: 0 0 20px;
  color: var(--app-text);
}

.section-title .el-icon {
  color: var(--app-accent);
}

.card-col {
  margin-bottom: 20px;
}

/* 关于我们 */
.about-card p {
  font-size: 14px;
  color: var(--app-text-secondary);
  line-height: 2;
  margin: 0 0 12px;
}

.about-card .section-title {
  margin-bottom: 16px;
}

/* 核心能力卡片 */
.capability-card {
  height: 100%;
  text-align: center;
}

.capability-icon {
  color: var(--app-accent);
  margin-bottom: 12px;
}

.capability-card h3 {
  margin: 8px 0;
  font-size: 16px;
}

.capability-card p {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

/* 里程碑时间线 */
.milestone-timeline {
  padding: 12px 8px 0;
}

.milestone-title {
  margin: 0 0 6px;
  font-size: 15px;
  color: var(--app-text);
}

.milestone-desc {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.7;
}

/* 联系方式卡片 */
.contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.contact-icon {
  color: var(--app-accent);
  flex-shrink: 0;
}

.contact-label {
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-bottom: 4px;
}

.contact-value {
  font-size: 14px;
  color: var(--app-text);
}

@media (max-width: 768px) {
  .section-title {
    font-size: 18px;
  }
}
</style>
