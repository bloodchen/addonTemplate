import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import GotoView from '../views/GotoView.vue'

const routes = [
  {
    path: '/',
    name: 'Game',
    component: GameView
  },
  {
    path: '/goto',
    name: 'Goto',
    component: GotoView,
    props: route => ({ to: route.query.to })
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router