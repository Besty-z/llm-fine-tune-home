<template>
  <div class="content-manager">
    <!-- 工具栏 -->
    <div class="manager-toolbar">
      <el-input
        v-model="query.keyword"
        :placeholder="`搜索${config.label}`"
        clearable
        style="width: 240px"
        :prefix-icon="Search"
        @keyup.enter="reload"
        @clear="reload"
      />
      <el-button type="primary" plain @click="reload">查询</el-button>
      <el-button type="primary" :icon="Plus" @click="openEditor()">新增{{ config.label }}</el-button>
    </div>

    <!-- 列表 -->
    <el-table :data="list" v-loading="loading" style="width: 100%" empty-text="暂无数据">
      <el-table-column
        v-for="col in config.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tag v-if="col.bool" :type="row[col.prop] ? 'success' : 'info'" size="small" effect="dark">
            {{ row[col.prop] ? '是' : '否' }}
          </el-tag>
          <span v-else-if="col.time">{{ formatTime(row[col.prop]) }}</span>
          <span v-else>{{ row[col.prop] }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEditor(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="manager-pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="load"
        @size-change="reload"
      />
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item v-for="field in config.fields" :key="field.prop" :label="field.label" :prop="field.prop">
          <el-input
            v-if="field.type === 'input'"
            v-model="form[field.prop]"
            :placeholder="`请输入${field.label}`"
          />
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="form[field.prop]"
            type="textarea"
            :rows="6"
            :placeholder="`请输入${field.label}`"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="form[field.prop]"
            :min="0"
            style="width: 100%"
          />
          <el-select v-else-if="field.type === 'select'" v-model="form[field.prop]" style="width: 100%">
            <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-switch v-else-if="field.type === 'switch'" v-model="form[field.prop]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  fetchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  fetchFaqsPaged,
  createFaq,
  updateFaq,
  deleteFaq,
  fetchAdverts,
  createAdvert,
  updateAdvert,
  deleteAdvert
} from '@/api'

const props = defineProps({
  /** 内容类型：articles / faqs / adverts */
  type: { type: String, required: true }
})

// 各内容类型的字段与接口配置
const CONFIG = {
  articles: {
    label: '文章',
    list: fetchArticles,
    create: createArticle,
    update: updateArticle,
    remove: deleteArticle,
    defaults: { title: '', summary: '', content: '', category: 'tech', published: true },
    columns: [
      { prop: 'title', label: '标题', minWidth: 200 },
      { prop: 'category', label: '分类', width: 110 },
      { prop: 'summary', label: '摘要', minWidth: 220 },
      { prop: 'updatedAt', label: '更新时间', width: 170, time: true },
      { prop: 'published', label: '已发布', width: 90, bool: true }
    ],
    fields: [
      { prop: 'title', label: '标题', type: 'input', required: true },
      { prop: 'summary', label: '摘要', type: 'input' },
      { prop: 'category', label: '分类', type: 'select', options: [
        { label: '技术', value: 'tech' },
        { label: '企业', value: 'enterprise' }
      ] },
      { prop: 'content', label: '正文（Markdown）', type: 'textarea' },
      { prop: 'published', label: '是否发布', type: 'switch' }
    ]
  },
  faqs: {
    label: 'FAQ',
    list: fetchFaqsPaged,
    create: createFaq,
    update: updateFaq,
    remove: deleteFaq,
    defaults: { question: '', answer: '', sort: 0 },
    columns: [
      { prop: 'question', label: '问题', minWidth: 240 },
      { prop: 'answer', label: '答案', minWidth: 300 },
      { prop: 'sort', label: '排序', width: 90 },
      { prop: 'updatedAt', label: '更新时间', width: 170, time: true }
    ],
    fields: [
      { prop: 'question', label: '问题', type: 'input', required: true },
      { prop: 'answer', label: '答案', type: 'textarea', required: true },
      { prop: 'sort', label: '排序值（越小越靠前）', type: 'number' }
    ]
  },
  adverts: {
    label: '广告',
    list: fetchAdverts,
    create: createAdvert,
    update: updateAdvert,
    remove: deleteAdvert,
    defaults: { title: '', imageUrl: '', linkUrl: '', position: 'home', sort: 0, enabled: true },
    columns: [
      { prop: 'title', label: '标题', minWidth: 200 },
      { prop: 'position', label: '投放位置', width: 120 },
      { prop: 'linkUrl', label: '跳转地址', minWidth: 220 },
      { prop: 'sort', label: '排序', width: 90 },
      { prop: 'enabled', label: '启用', width: 90, bool: true },
      { prop: 'updatedAt', label: '更新时间', width: 170, time: true }
    ],
    fields: [
      { prop: 'title', label: '标题', type: 'input', required: true },
      { prop: 'imageUrl', label: '图片地址', type: 'input' },
      { prop: 'linkUrl', label: '跳转地址', type: 'input' },
      { prop: 'position', label: '投放位置', type: 'select', options: [
        { label: '首页', value: 'home' },
        { label: '侧边栏', value: 'sidebar' }
      ] },
      { prop: 'sort', label: '排序值', type: 'number' },
      { prop: 'enabled', label: '是否启用', type: 'switch' }
    ]
  }
}

const config = computed(() => CONFIG[props.type])

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, keyword: '' })

// 弹窗状态
const dialogVisible = ref(false)
const editingId = ref('')
const formRef = ref(null)
const form = reactive({})

const dialogTitle = computed(() => `${editingId.value ? '编辑' : '新增'}${config.value.label}`)

// 由字段配置生成必填校验规则
const rules = computed(() =>
  Object.fromEntries(
    config.value.fields
      .filter((field) => field.required)
      .map((field) => [field.prop, [{ required: true, message: `请填写${field.label}`, trigger: 'blur' }]])
  )
)

/** 时间格式化 */
const formatTime = (value) => (value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-')

/** 加载列表 */
const load = async () => {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    const data = await config.value.list(params)
    list.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载列表失败')
  } finally {
    loading.value = false
  }
}

/** 重置分页并重新加载 */
const reload = () => {
  query.page = 1
  load()
}

/** 打开新增 / 编辑弹窗 */
const openEditor = (row) => {
  editingId.value = row?._id || ''
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, row ? { ...row } : { ...config.value.defaults })
  dialogVisible.value = true
}

/** 保存（新增或更新） */
const handleSave = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {}
    config.value.fields.forEach((field) => {
      payload[field.prop] = form[field.prop]
    })
    if (editingId.value) {
      await config.value.update(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await config.value.create(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    load()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

/** 删除（软删除） */
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('删除后前台将不再展示，确定删除吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await config.value.remove(row._id)
    ElMessage.success('删除成功')
    load()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.manager-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.manager-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

@media (max-width: 768px) {
  .manager-toolbar :deep(.el-input) {
    width: 100% !important;
  }
}
</style>
