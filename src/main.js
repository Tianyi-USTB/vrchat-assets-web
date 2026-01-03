import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 1. 必须导入 router 配置

const app = createApp(App)

app.use(router) // 2. 关键步骤：告诉 Vue 使用这个路由插件
app.mount('#app')