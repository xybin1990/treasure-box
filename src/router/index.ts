import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/home/index'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/rename-bilibili', name: 'RenameBilibili', component: () => import('@/views/rename-bilibili') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
