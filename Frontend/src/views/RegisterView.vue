<template>
  <div class="register-page">
    <!-- 注册卡片 -->
    <div class="tech-card register-card">
      <div class="register-header">
        <el-icon :size="40" class="register-logo"><Cpu /></el-icon>
        <h1>创建账号</h1>
        <p>大模型微调技术之家</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        label-position="top"
        @keyup.enter="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="2~20 个字符"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少 6 位"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loading"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-tip">
        <el-divider content-position="center">
          <span class="tip-text">已有账号？</span>
        </el-divider>
        <router-link to="/login" class="login-link">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { register, login, saveAuth } from '@/api'

const router = useRouter()

// 表单引用与数据
const formRef = ref(null)
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

/** 确认密码一致性校验 */
const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单校验规则（与后端 Zod 规则保持一致）
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度需在 2~20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度需在 6~64 位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

/** 提交注册：成功后自动登录并跳转首页 */
const handleRegister = async () => {
  // 表单校验失败则中止
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const { username } = await register(form.username, form.password)
    ElMessage.success(`注册成功，欢迎你，${username}`)
    // 注册成功后自动登录，免去二次输入
    try {
      const { token, username: loginName } = await login(form.username, form.password)
      saveAuth(token, loginName)
      router.push('/')
    } catch {
      // 自动登录失败则引导手动登录
      router.push('/login')
    }
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--app-navbar-height) + 24px) 16px 48px;
  /* 科技感渐变光晕背景 */
  background:
    radial-gradient(ellipse 50% 40% at 50% 30%, rgba(79, 195, 247, 0.12), transparent),
    var(--app-bg);
}

.register-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px;
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.register-logo {
  color: var(--app-accent);
  margin-bottom: 8px;
}

.register-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  background: linear-gradient(90deg, #4fc3f7, #b3e5fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.register-header p {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-secondary);
  letter-spacing: 2px;
}

.register-tip {
  margin-top: 8px;
  text-align: center;
}

.tip-text {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.login-link {
  font-size: 13px;
  color: var(--app-accent);
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
    padding: 28px 20px;
  }
}
</style>
