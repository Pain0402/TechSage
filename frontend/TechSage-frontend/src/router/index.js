import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/views/HomeView.vue' // Giờ là trang landing cho khách
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProjectWorkspaceView from '@/views/ProjectWorkspaceView.vue'
import AuthenticationView from '@/views/AuthenticationView.vue' // Trang xác thực chung

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: 'home',
      component: HomeView, // Trang chủ/landing page
    },
    {
      path: '/auth',
      component: AuthenticationView, // Sử dụng layout cho các trang xác thực/công khai
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
        },
        {
          path: 'register',
          name: 'register',
          component: RegisterView,
        },
      ],
    },
    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'project/:id',
          name: 'project-workspace',
          component: ProjectWorkspaceView,
        },
        // Điều hướng mặc định khi người dùng truy cập /app
        {
          path: '',
          redirect: { name: 'dashboard' },
        },
      ],
    },
    // Route "catch-all" để xử lý 404, chuyển hướng về trang chủ
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'home' },
    },
  ],
})

// "Cổng bảo vệ" - Navigation Guard được nâng cấp
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuestRoute = ['home', 'login', 'register'].includes(to.name)

  if (requiresAuth && !isLoggedIn) {
    // Nếu route yêu cầu đăng nhập mà người dùng chưa đăng nhập
    // -> chuyển hướng đến trang đăng nhập.
    // Lưu lại trang định đến để có thể quay lại sau khi đăng nhập thành công.
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (isGuestRoute && isLoggedIn) {
    // Nếu người dùng đã đăng nhập mà cố vào các trang khách (home, login, register)
    // -> chuyển hướng đến trang dashboard.
    next({ name: 'dashboard' })
  } else {
    // Nếu mọi thứ ổn, cho phép đi tiếp
    next()
  }
})

export default router
