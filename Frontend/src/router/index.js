import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载，按需打包
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

// 全局前置守卫：动态设置页面标题
router.beforeEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} - 大模型微调技术之家`
    : '大模型微调技术之家'
})

export default router
