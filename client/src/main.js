import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Inventory from './views/Inventory.vue'
import Orders from './views/Orders.vue'
import Demand from './views/Demand.vue'
import Spending from './views/Spending.vue'
import Reports from './views/Reports.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard, meta: { nav: true, titleKey: 'nav.overview', icon: 'grid' } },
    { path: '/inventory', component: Inventory, meta: { nav: true, titleKey: 'nav.inventory', icon: 'box' } },
    { path: '/orders', component: Orders, meta: { nav: true, titleKey: 'nav.orders', icon: 'cart' } },
    { path: '/spending', component: Spending, meta: { nav: true, titleKey: 'nav.finance', icon: 'wallet' } },
    { path: '/demand', component: Demand, meta: { nav: true, titleKey: 'nav.demandForecast', icon: 'trending' } },
    { path: '/reports', component: Reports, meta: { nav: true, titleKey: 'nav.reports', icon: 'file' } }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
