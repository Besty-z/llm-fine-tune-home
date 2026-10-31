<template>
  <!-- 站点页脚 -->
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-title">大模型微调技术之家</span>
        <p class="footer-desc">专注大语言模型微调技术、开源生态与工程实践</p>
      </div>
      <div class="footer-links">
        <router-link to="/tech">技术概要</router-link>
        <router-link to="/ranking">开源项目榜单</router-link>
        <router-link to="/enterprise">企业介绍</router-link>
        <router-link to="/faq">FAQ问答</router-link>
      </div>
      <p class="footer-copy">© {{ year }} 大模型微调技术之家 · 仅供学习交流</p>
    </div>
  </footer>
</template>

<script setup>
// 当前年份（版权信息）
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  border-top: 1px solid var(--app-border);
  background: var(--app-bg-secondary);
  padding: 32px 20px;
}

.footer-inner {
  max-width: var(--app-max-width);
  margin: 0 auto;
  text-align: center;
}

.footer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-accent);
}

.footer-desc {
  margin: 8px 0 16px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
}

.footer-links a {
  font-size: 13px;
  color: var(--app-text-secondary);
}

.footer-links a:hover {
  color: var(--app-accent);
}

.footer-copy {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-placeholder, #5b6d94);
}
</style>
