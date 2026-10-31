import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Vite 配置：Vue 插件 + 路径别名 + 后端代理（联调时使用）
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 使用 @ 指向 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境下将 /api 请求代理到后端服务（此处仅为前端，联调时改为真实后端地址）
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
