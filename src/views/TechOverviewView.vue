<template>
  <div class="page-container">
    <div class="page-header">
      <h1>技术概要</h1>
      <p>大模型微调方法体系：从全参数微调到参数高效微调（PEFT）</p>
    </div>

    <!-- 微调流程图（步骤条） -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><Guide /></el-icon> 微调标准流程
      </h2>
      <div class="tech-card">
        <el-steps :active="6" align-center class="tech-steps" :direction="stepsDirection">
          <el-step v-for="step in pipelineSteps" :key="step.title" :title="step.title" :description="step.desc" />
        </el-steps>
      </div>
    </section>

    <!-- 主流微调方法对比卡片 -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><SetUp /></el-icon> 主流微调方法
      </h2>
      <el-row :gutter="20">
        <el-col
          v-for="method in methods"
          :key="method.name"
          :xs="24"
          :sm="12"
          :md="8"
          class="card-col"
        >
          <div class="tech-card method-card">
            <div class="method-head">
              <h3>{{ method.name }}</h3>
              <el-tag :type="method.tagType" size="small" effect="dark">{{ method.tag }}</el-tag>
            </div>
            <p class="method-desc">{{ method.desc }}</p>
            <ul class="method-points">
              <li v-for="point in method.points" :key="point">{{ point }}</li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- 技术选型速查表 -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><Grid /></el-icon> 技术选型速查
      </h2>
      <div class="tech-card table-card">
        <el-table :data="selectionTable" style="width: 100%">
          <el-table-column prop="scenario" label="应用场景" min-width="140" />
          <el-table-column prop="recommend" label="推荐方案" min-width="140" />
          <el-table-column prop="hardware" label="参考硬件门槛" min-width="140" />
        </el-table>
      </div>
    </section>

    <!-- 对齐训练方法 -->
    <section class="section">
      <h2 class="section-title">
        <el-icon><Aim /></el-icon> 偏好对齐训练
      </h2>
      <el-row :gutter="20">
        <el-col
          v-for="align in alignMethods"
          :key="align.name"
          :xs="24"
          :sm="12"
          :md="12"
          class="card-col"
        >
          <div class="tech-card method-card">
            <div class="method-head">
              <h3>{{ align.name }}</h3>
              <el-tag type="success" size="small" effect="dark">{{ align.tag }}</el-tag>
            </div>
            <p class="method-desc">{{ align.desc }}</p>
          </div>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 微调标准流程步骤
const pipelineSteps = [
  { title: '场景定义', desc: '明确任务与目标' },
  { title: '数据构建', desc: '采集与清洗样本' },
  { title: '基座选型', desc: '选择预训练模型' },
  { title: '方法选择', desc: '全参 / LoRA / QLoRA' },
  { title: '训练调优', desc: '超参与显存优化' },
  { title: '评估上线', desc: '评测与部署迭代' }
]

// 主流微调方法
const methods = [
  {
    name: '全参数微调',
    tag: '效果上限最高',
    tagType: 'danger',
    desc: '更新模型全部参数，充分适配目标任务，通常能取得该基座下的最佳效果。',
    points: ['显存开销大，需多卡并行', '适合数据充足的核心场景', '存在灾难性遗忘风险']
  },
  {
    name: 'LoRA',
    tag: '主流首选',
    tagType: 'primary',
    desc: '冻结基座权重，通过低秩矩阵注入可训练旁路，训练参数量仅为全量的 0.1%~1%。',
    points: ['显存友好，单卡可训', '权重可插拔、便于多任务', '与全参效果差距很小']
  },
  {
    name: 'QLoRA',
    tag: '极致显存优化',
    tagType: 'primary',
    desc: '基座模型 4bit 量化后叠加 LoRA 训练，让 65B 级模型在单张 48G 显卡上可微调。',
    points: ['消费级显卡即可入门', '量化带来轻微精度损失', '与 NF4 量化格式搭配']
  },
  {
    name: 'Prefix-Tuning',
    tag: '轻量方案',
    tagType: 'info',
    desc: '仅训练输入前缀的连续向量（Virtual Tokens），不动模型主体参数。',
    points: ['训练参数极少', '生成任务表现稳定', '对长输入有长度占用']
  },
  {
    name: 'P-Tuning v2',
    tag: '轻量方案',
    tagType: 'info',
    desc: '在每一层注入可训练的提示向量，是 Prefix-Tuning 的深层改进版本。',
    points: ['NLU 任务效果好', '中小模型也适用', '训练收敛较快']
  },
  {
    name: 'AdaLoRA',
    tag: '自适应改进',
    tagType: 'warning',
    desc: '根据重要性评分动态分配各层 LoRA 秩，把参数预算用在刀刃上。',
    points: ['参数预算利用率更高', '训练流程相对复杂', '适合精细化调优场景']
  }
]

// 技术选型速查表
const selectionTable = [
  { scenario: '快速验证 / 学习研究', recommend: 'QLoRA + LLaMA-Factory', hardware: '单卡 24G（如 RTX 4090）' },
  { scenario: '企业知识问答 / 客服', recommend: 'LoRA + 领域 SFT 数据', hardware: '单卡 40~80G（如 A100）' },
  { scenario: '核心业务深度定制', recommend: '全参数微调 + DeepSpeed ZeRO', hardware: '多卡 80G 集群' },
  { scenario: '多任务 / 多租户服务', recommend: '基座 + 多 LoRA 权重热切换', hardware: '单卡起步，按并发扩展' },
  { scenario: '回答风格与安全对齐', recommend: 'SFT + DPO 组合训练', hardware: '与 SFT 阶段同级配置' }
]

// 偏好对齐方法
const alignMethods = [
  {
    name: 'RLHF / PPO',
    tag: '经典方案',
    desc: '先训练奖励模型，再用 PPO 强化学习优化策略，是 ChatGPT 的核心对齐技术，效果显著但流程复杂、训练不稳定。'
  },
  {
    name: 'DPO',
    tag: '当前主流',
    desc: '直接基于偏好对数据进行优化，省去奖励模型与强化学习环节，训练简单稳定，已广泛应用于开源模型对齐。'
  },
  {
    name: 'ORPO / KTO',
    tag: '新兴简化方案',
    desc: 'ORPO 将 SFT 与偏好优化合为一步；KTO 只需「好/坏」二元反馈而非成对数据，进一步降低数据构建门槛。'
  },
  {
    name: 'RLAIF / 自我改进',
    tag: '前沿方向',
    desc: '使用 AI 反馈替代人工标注构建偏好数据，大幅降低对齐成本，适合规模化数据生产。'
  }
]

// 移动端步骤条改为纵向展示
const windowWidth = ref(window.innerWidth)
const stepsDirection = computed(() => (windowWidth.value <= 768 ? 'vertical' : 'horizontal'))
const onResize = () => (windowWidth.value = window.innerWidth)
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
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

/* 方法卡片 */
.method-card {
  height: 100%;
}

.method-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.method-head h3 {
  margin: 0;
  font-size: 17px;
}

.method-desc {
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.7;
  margin: 0 0 12px;
}

.method-points {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.9;
}

.method-points li::marker {
  color: var(--app-accent);
}

/* 表格卡片：移动端允许横向滚动 */
.table-card {
  padding: 12px;
  overflow-x: auto;
}

.table-card :deep(.el-table) {
  min-width: 560px;
  background: transparent;
}

/* 步骤条配色微调 */
.tech-steps {
  padding: 12px 0;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 18px;
  }

  .table-card {
    padding: 8px;
  }
}
</style>
