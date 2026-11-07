import { createRouter, createWebHistory } from 'vue-router'
import { getToken, isAdmin } from '@/api'

// 路由懒加载，按需打包
// meta.requiresAuth：需登录；meta.requiresAdmin：需管理员
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/tech',
    name: 'Tech',
    component: () => import('@/views/TechOverviewView.vue'),
    meta: { title: '技术概要' }
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/views/RankingView.vue'),
    meta: { title: '开源项目榜单' }
  },
  {
    path: '/enterprise',
    name: 'Enterprise',
    component: () => import('@/views/EnterpriseView.vue'),
    meta: { title: '企业介绍' }
  },
  {
    path: '/faq',
    name: 'Faq',
    component: () => import('@/views/FaqView.vue'),
    meta: { title: 'FAQ 问答' }
  },
  {
    path: '/tasks',
    name: 'TaskList',
    component: () => import('@/views/TaskListView.vue'),
    meta: { title: '微调工作台', requiresAuth: true }
  },
  {
    path: '/tasks/create',
    name: 'TaskCreate',
    component: () => import('@/views/TaskCreateView.vue'),
    meta: { title: '新建微调任务', requiresAuth: true }
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('@/views/TaskDetailView.vue'),
    meta: { title: '任务详情', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: '注册' }
  },
  // 未匹配路径重定向到首页
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换时回到页面顶部
  scrollBehavior: () => ({ top: 0 })
})

// 全局前置守卫：设置页面标题 + 登录/管理员权限校验
router.beforeEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} - 大模型微调技术之家`
    : '大模型微调技术之家'

  // 未登录访问受保护页面 -> 跳转登录并记录回跳地址
  if (to.meta.requiresAuth && !getToken()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  // 非管理员访问后台 -> 回到首页
  if (to.meta.requiresAdmin && !isAdmin()) {
    return { path: '/' }
  }
})

export default router
