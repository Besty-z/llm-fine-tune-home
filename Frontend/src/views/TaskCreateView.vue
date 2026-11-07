<template>
  <div class="page-container">
    <div class="page-header">
      <h1>新建微调任务</h1>
      <p>参考 LLaMA-Board 的配置流程：选择基座模型、数据集与微调方法，调整关键超参后即可启动训练</p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      v-loading="loading"
      class="create-form"
    >
      <div class="form-grid">
        <!-- 左列：模型与数据 -->
        <section class="tech-card form-section">
          <h3 class="section-title"><el-icon><Cpu /></el-icon> 模型与数据</h3>

          <el-form-item label="任务名称" prop="name">
            <el-input v-model="form.name" placeholder="例如：Qwen2.5-7B 客服领域 LoRA 微调" maxlength="50" show-word-limit />
          </el-form-item>

          <el-form-item label="基座模型" prop="baseModel">
            <el-select v-model="form.baseModel" placeholder="选择基座模型" style="width: 100%" @change="onModelChange">
              <el-option
                v-for="item in catalog.models"
                :key="item.id"
                :label="`${item.name}（${item.params}）`"
                :value="item.name"
              >
                <div class="option-row">
                  <span>{{ item.name }}</span>
                  <span class="option-hint">{{ item.params }} · 约 {{ item.sizeGb }}GB</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="训练数据集" prop="dataset">
            <el-select v-model="form.dataset" placeholder="选择数据集" style="width: 100%" @change="onDatasetChange">
              <el-option
                v-for="item in catalog.datasets"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                <div class="option-row">
                  <span>{{ item.name }}</span>
                  <span class="option-hint">{{ item.size }}</span>
                </div>
              </el-option>
              <el-option label="自定义数据集地址" value="__custom__" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="form.dataset === '__custom__'" label="数据集地址" prop="datasetUrl">
            <el-input v-model="form.datasetUrl" placeholder="https://example.com/dataset.jsonl" />
          </el-form-item>

          <el-alert
            v-if="selectedModel"
            :title="selectedModel.description"
            type="info"
            :closable="false"
            show-icon
            class="tip-alert"
          />
        </section>

        <!-- 右列：微调方法 -->
        <section class="tech-card form-section">
          <h3 class="section-title"><el-icon><SetUp /></el-icon> 微调方法</h3>

          <div class="method-cards">
            <div
              v-for="item in catalog.methods"
              :key="item.value"
              class="method-card"
              :class="{ active: form.method === item.value }"
              @click="form.method = item.value"
            >
              <div class="method-head">
                <span class="method-name">{{ item.label }}</span>
                <el-radio :model-value="form.method" :value="item.value" />
              </div>
              <p class="method-desc">{{ item.description }}</p>
            </div>
          </div>

          <el-alert
            v-if="showFullWarning"
            title="全参微调显存需求极高：13B 以上模型在单卡环境下会触发显存溢出（演示中会模拟 OOM 失败）"
            type="warning"
            :closable="false"
            show-icon
          />
        </section>
      </div>

      <!-- 训练超参 -->
      <section class="tech-card form-section">
        <h3 class="section-title"><el-icon><Operation /></el-icon> 训练超参</h3>

        <div class="param-grid">
          <el-form-item label="学习率" prop="learningRate">
            <el-input-number v-model="form.learningRate" :min="0.000001" :max="0.01" :step="0.0001" :precision="6" style="width: 100%" />
          </el-form-item>
          <el-form-item label="训练轮数 (epochs)" prop="epochs">
            <el-input-number v-model="form.epochs" :min="1" :max="20" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="批大小 (batch size)" prop="batchSize">
            <el-input-number v-model="form.batchSize" :min="1" :max="64" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="梯度累积步数" prop="gradientAccumulation">
            <el-input-number v-model="form.gradientAccumulation" :min="1" :max="64" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="截断长度 (cutoff len)" prop="cutoffLen">
            <el-input-number v-model="form.cutoffLen" :min="128" :max="8192" :step="128" style="width: 100%" />
          </el-form-item>
          <el-form-item v-if="form.method !== 'full'" label="LoRA 秩 (r)" prop="loraRank">
            <el-input-number v-model="form.loraRank" :min="1" :max="128" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item v-if="form.method !== 'full'" label="LoRA alpha" prop="loraAlpha">
            <el-input-number v-model="form.loraAlpha" :min="1" :max="256" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item v-if="form.method === 'qlora'" label="量化位数" prop="quantBits">
            <el-select v-model="form.quantBits" style="width: 100%">
              <el-option label="4bit（推荐，显存占用最低）" :value="4" />
              <el-option label="8bit" :value="8" />
            </el-select>
          </el-form-item>
        </div>
      </section>

      <!-- 提交区 -->
      <div class="submit-bar">
        <el-checkbox v-model="startAfterCreate">创建后立即启动训练</el-checkbox>
        <div class="submit-actions">
          <el-button @click="router.push('/tasks')">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">创建任务</el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchCatalog, createTask, startTask } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const startAfterCreate = ref(true)

// 目录数据（后端静态配置）
const catalog = reactive({ models: [], datasets: [], methods: [] })

// 表单数据
const form = reactive({
  name: '',
  baseModel: '',
  dataset: 'alpaca_zh',
  datasetUrl: '',
  method: 'lora',
  learningRate: 0.0002,
  epochs: 3,
  batchSize: 4,
  gradientAccumulation: 4,
  cutoffLen: 1024,
  loraRank: 8,
  loraAlpha: 16,
  quantBits: 4
})

// 校验规则
const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  baseModel: [{ required: true, message: '请选择基座模型', trigger: 'change' }],
  dataset: [{ required: true, message: '请选择训练数据集', trigger: 'change' }],
  datasetUrl: [
    {
      validator: (rule, value, callback) => {
        if (form.dataset !== '__custom__') return callback()
        if (!value) return callback(new Error('请输入数据集地址'))
        try {
          // eslint-disable-next-line no-new
          new URL(value)
          callback()
        } catch {
          callback(new Error('数据集地址格式不正确'))
        }
      },
      trigger: 'blur'
    }
  ]
}

/** 当前选中的模型 */
const selectedModel = computed(() => catalog.models.find((item) => item.name === form.baseModel) || null)

/** 全参微调 + 大模型时给出显存风险提示 */
const showFullWarning = computed(() => form.method === 'full' && /(13B|14B|70B|16B)/i.test(form.baseModel))

/** 切换模型：按推荐方法自动匹配，并生成默认任务名 */
const onModelChange = () => {
  const model = selectedModel.value
  if (!model) return
  form.method = model.recommendedMethod
  if (!form.name) {
    form.name = `${model.name} 领域微调`
  }
}

/** 切换数据集：从自定义切回目录数据集时清空地址 */
const onDatasetChange = () => {
  if (form.dataset !== '__custom__') {
    form.datasetUrl = ''
  }
}

/** 加载目录与默认值 */
const loadCatalog = async () => {
  loading.value = true
  try {
    const data = await fetchCatalog()
    catalog.models = data.models || []
    catalog.datasets = data.datasets || []
    catalog.methods = data.methods || []
    Object.assign(form, data.defaults || {})
    // 默认选中第一个模型
    if (!form.baseModel && catalog.models.length) {
      form.baseModel = catalog.models[0].name
      onModelChange()
    }
  } catch (error) {
    ElMessage.error(error.message || '加载微调目录失败')
  } finally {
    loading.value = false
  }
}

/** 提交创建（可选立即启动） */
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const isCustom = form.dataset === '__custom__'
    const task = await createTask({
      name: form.name,
      baseModel: form.baseModel,
      datasetUrl: isCustom ? form.datasetUrl : '',
      trainingConfig: {
        method: form.method,
        dataset: isCustom ? 'custom' : form.dataset,
        learningRate: form.learningRate,
        epochs: form.epochs,
        batchSize: form.batchSize,
        gradientAccumulation: form.gradientAccumulation,
        loraRank: form.loraRank,
        loraAlpha: form.loraAlpha,
        cutoffLen: form.cutoffLen,
        quantBits: form.quantBits
      }
    })
    if (startAfterCreate.value) {
      await startTask(task._id)
      ElMessage.success('任务已创建并启动训练')
    } else {
      ElMessage.success('任务创建成功，可在列表中启动')
    }
    router.push(`/tasks/${task._id}`)
  } catch (error) {
    ElMessage.error(error.message || '创建任务失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadCatalog)
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-section {
  padding: 20px 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  font-size: 16px;
  color: var(--app-accent);
}

.option-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.option-hint {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.tip-alert {
  margin-top: 4px;
}

/* 微调方法卡片 */
.method-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.method-card {
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-bg-tertiary);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.method-card:hover {
  border-color: var(--app-accent);
}

.method-card.active {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 1px var(--app-accent), 0 4px 16px var(--app-accent-glow);
}

.method-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.method-name {
  font-weight: 600;
  color: var(--app-text);
}

.method-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--app-text-secondary);
}

/* 超参网格 */
.param-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px 18px;
}

.submit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 4px 24px;
}

.submit-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .param-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .form-section {
    padding: 16px;
  }

  .param-grid {
    grid-template-columns: 1fr;
  }

  .submit-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
