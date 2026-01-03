import { createRouter, createWebHistory } from 'vue-router';
// 确保这些组件路径是对的
import Home from '../views/Home.vue';
import Detail from '../views/Detail.vue'; 
import Admin from '../views/Admin.vue';

const routes = [
  { 
    path: '/', 
    name: 'Home',
    component: Home 
  },
  { 
    path: '/admin', 
    name: 'Admin',
    component: Admin 
  },
  { 
    // 动态路由 /:id 必须放在 /admin 后面！
    // 否则访问 /admin 时会被识别成 id="admin"
    path: '/:id', 
    name: 'Detail',
    component: Detail 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;