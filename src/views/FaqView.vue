<template>
  <div class="page-container">
    <div class="page-header">
      <h1>FAQ 问答</h1>
      <p>大模型微调常见问题与实践答疑</p>
    </div>

    <!-- 搜索框 -->
    <div class="faq-search">
      <el-input
        v-model="keyword"
        placeholder="搜索问题关键词，如：LoRA、数据量、评估..."
        clearable
        size="large"
        :prefix-icon="Search"
      />
    </div>

    <!-- FAQ 折叠面板 -->
    <div class="tech-card faq-card" v-loading="loading">
      <el-collapse v-model="activeNames" accordion>
        <el-collapse-item
          v-for="faq in filteredFaqs"
          :key="faq.id"
          :name="faq.id"
        >
          <template #title>
            <span class="faq-question">
              <el-icon class="faq-q-icon"><QuestionFilled /></el-icon>
              {{ faq.question }}
            </span>
          </template>
          <p class="faq-answer">{{ faq.answer }}</p>
        </el-collapse-item>
      </el-collapse>
      <el-empty
        v-if="!loading && filteredFaqs.length === 0"
        description="没有找到相关问题，换个关键词试试"
      />
    </div>

    <!-- 底部提示 -->
    <div class="faq-footer">
      <p>没有找到你想问的问题？欢迎通过 <router-link to="/enterprise">企业介绍</router-link> 页中的联系方式与我们交流。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { fetchFaqList } from '@/api'

// FAQ 数据与状态
const faqs = ref([])
const loading = ref(false)
const keyword = ref('')
// 当前展开的面板（默认展开第一条）
const activeNames = ref(1)

// 按关键字过滤问题与答案
const filteredFaqs = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return faqs.value
  return faqs.value.filter(
    (f) => f.question.toLowerCase().includes(kw) || f.answer.toLowerCase().includes(kw)
  )
})

onMounted(async () => {
  loading.value = true
  try {
    faqs.value = await fetchFaqList()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.faq-search {
  max-width: 560px;
  margin: 0 auto 24px;
}

.faq-card {
  padding: 8px 24px;
}

.faq-question {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
}

.faq-q-icon {
  color: var(--app-accent);
  flex-shrink: 0;
}

.faq-answer {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-secondary);
  line-height: 2;
}

.faq-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

@media (max-width: 768px) {
  .faq-card {
    padding: 4px 14px;
  }

  .faq-question {
    font-size: 14px;
  }
}
</style>
