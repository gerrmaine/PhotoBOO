import { createRouter, createWebHistory } from 'vue-router'
import { sessions } from '@/api/client.js'
import LandingView from '@/views/LandingView.vue'

// The photobooth and world bundles are split so someone who only ever shoots a
// solo strip never downloads the lobby code.
const routes = [
  { path: '/', name: 'home', component: LandingView },
  {
    path: '/photobooth',
    name: 'photobooth',
    component: () => import('@/views/PhotoboothView.vue'),
  },
  {
    path: '/world/:id',
    name: 'world',
    component: () => import('@/views/WorldLobbyView.vue'),
    beforeEnter: (to) => {
      // The lobby is unusable without a member token; send strangers to the
      // landing page rather than showing a 401. Visiting any world you belong
      // to also makes it the active one, so deep links and the back button work.
      if (!sessions.find(to.params.id)) return { name: 'home' }
      sessions.setActive(to.params.id)
      return true
    },
  },
  { path: '/s/:slug', name: 'strip', component: () => import('@/views/StripShareView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
