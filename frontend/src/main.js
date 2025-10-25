import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import { messages } from './i18n/index.js'

// 创建国际化实例
const i18n = createI18n({
  locale: 'zh-CN', // 默认语言
  fallbackLocale: 'en',
  messages
})

// 创建Vue应用
const app = createApp(App)

// 使用路由和国际化插件
app.use(router)
app.use(i18n)

// 挂载应用
app.mount('#app')