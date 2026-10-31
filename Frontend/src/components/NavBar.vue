<template>
  <!-- 固定顶部导航栏：桌面端横向菜单，移动端汉堡抽屉 -->
  <header class="navbar">
    <div class="navbar-inner">
      <!-- Logo 区域 -->
      <router-link to="/" class="navbar-logo" @click="closeDrawer">
        <el-icon :size="26" class="logo-icon"><Cpu /></el-icon>
        <span class="logo-text">大模型微调技术之家</span>
      </router-link>

      <!-- 桌面端导航菜单（>768px 显示） -->
      <nav class="navbar-menu desktop-only">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.title }}
        </router-link>
      </nav>

      <!-- 右侧操作区：登录按钮 / 已登录用户信息 -->
      <div class="navbar-actions desktop-only">
        <template v-if="isLoggedIn">
          <el-dropdown @command="handleUserCommand">
            <span class="user-info">
              <el-icon><Avatar /></el-icon>
              <span class="username">{{ username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <el-button v-else type="primary" round @click="goLogin">登录</el-button>
      </div>

      <!-- 移动端汉堡按钮（<=768px 显示） -->
      <el-icon class="hamburger mobile-only" :size="24" @click="drawerVisible = true">
        <Expand />
      </el-icon>
    </div>

    <!-- 移动端抽屉菜单 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="70%"
      :with-header="false"
      class="navbar-drawer"
    >
      <div class="drawer-content">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="drawer-item"
          :class="{ active: isActive(item.path) }"
          @click="closeDrawer"
        >
          {{ item.title }}
        </router-link>

        <div class="drawer-footer">
          <template v-if="isLoggedIn">
            <div class="drawer-user">
              <el-icon><Avatar /></el-icon> {{ username }}
            </div>
            <el-button type="danger" plain round style="width: 100%" @click="handleLogout">
              退出登录
            </el-button>
          </template>
          <el-button v-else type="primary" round style="width: 100%" @click="goLogin">
            登录
          </el-button>
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getToken, getUsername, clearAuth, AUTH_CHANGE_EVENT } from '@/api'

const route = useRoute()
const router = useRouter()

// 移动端抽屉开关
const drawerVisible = ref(false)

// 登录状态（通过自定义事件实现跨组件刷新）
const tokenVersion = ref(0)
const isLoggedIn = computed(() => {
  // 依赖 tokenVersion 以便登录/登出时触发重新计算
  void tokenVersion.value
  return !!getToken()
})
const username = computed(() => {
  void tokenVersion.value
  return getUsername()
})

// 导航菜单配置
const menuItems = [
  { path: '/', title: '首页' },
  { path: '/tech', title: '技术概要' },
  { path: '/ranking', title: '开源项目榜单' },
  { path: '/enterprise', title: '企业介绍' },
  { path: '/faq', title: 'FAQ问答' }
]

/** 判断菜单项是否为当前路由 */
const isActive = (path) => (path === '/' ? route.path === '/' : route.path.startsWith(path))

/** 关闭抽屉 */
const closeDrawer = () => {
  drawerVisible.value = false
}

/** 跳转登录页 */
const goLogin = () => {
  closeDrawer()
  router.push('/login')
}

/** 退出登录 */
const handleLogout = () => {
  clearAuth()
  tokenVersion.value++
  closeDrawer()
  ElMessage.success('已退出登录')
  router.push('/')
}

/** 用户下拉菜单命令 */
const handleUserCommand = (command) => {
  if (command === 'logout') handleLogout()
}

// 监听登录状态变化事件（登录页登录成功后触发）
const onAuthChange = () => tokenVersion.value++
onMounted(() => window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange))
onUnmounted(() => window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: var(--app-navbar-height);
  background: rgba(10, 17, 40, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--app-border);
}

.navbar-inner {
  max-width: var(--app-max-width);
  height: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text);
}

.logo-icon {
  color: var(--app-accent);
}

.logo-text {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #4fc3f7, #b3e5fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 桌面端菜单 */
.navbar-menu {
  display: flex;
  gap: 4px;
}

.menu-item {
  padding: 6px 14px;
  border-radius: 6px;
  color: var(--app-text-secondary);
  font-size: 15px;
  transition: color 0.2s, background 0.2s;
}

.menu-item:hover {
  color: var(--app-accent);
  background: rgba(79, 195, 247, 0.08);
}

.menu-item.active {
  color: var(--app-accent);
  background: rgba(79, 195, 247, 0.12);
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-accent);
  cursor: pointer;
  font-size: 15px;
}

/* 响应式显隐控制 */
.mobile-only {
  display: none;
}

.hamburger {
  color: var(--app-text);
  cursor: pointer;
}

/* 抽屉菜单样式 */
.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 16px;
}

.drawer-item {
  padding: 14px 8px;
  font-size: 16px;
  color: var(--app-text-secondary);
  border-bottom: 1px solid var(--app-border);
}

.drawer-item.active {
  color: var(--app-accent);
}

.drawer-footer {
  margin-top: auto;
  padding: 20px 0;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--app-accent);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .logo-text {
    font-size: 15px;
  }
}
</style>
