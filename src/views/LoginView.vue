<template>
  <div class="login-page">
    <!-- 登录卡片 -->
    <div class="tech-card login-card">
      <div class="login-header">
        <el-icon :size="40" class="login-logo"><Cpu /></el-icon>
        <h1>欢迎登录</h1>
        <p>大模型微调技术之家</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        label-position="top"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="form.remember">记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tip">
        <el-divider content-position="center">
          <span class="tip-text">演示环境</span>
        </el-divider>
        <p>当前为前端演示环境，输入任意非空用户名和密码即可登录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login, saveAuth } from '@/api'

const router = useRouter()

// 表单引用与数据
const formRef = ref(null)
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  remember: false
})

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度需在 2~20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
}

/** 提交登录 */
const handleLogin = async () => {
  // 表单校验失败则中止
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const { token, username } = await login(form.username, form.password)
    // 保存登录态（NavBar 监听事件自动刷新）
    saveAuth(token, username)
    ElMessage.success(`欢迎回来，${username}`)
    router.push('/')
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
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

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  color: var(--app-accent);
  margin-bottom: 8px;
}

.login-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  background: linear-gradient(90deg, #4fc3f7, #b3e5fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-header p {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-secondary);
  letter-spacing: 2px;
}

.login-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-tip {
  margin-top: 8px;
  text-align: center;
}

.tip-text {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.login-tip p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-placeholder, #5b6d94);
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
  }
}
</style>
