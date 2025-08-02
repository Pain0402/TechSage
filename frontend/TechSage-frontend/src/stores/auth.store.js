import { defineStore } from 'pinia'
import apiService from '../services/api.service'
import router from '@/router' // Import router ở đây để sử dụng

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // *** SỬA LỖI: Lưu cả user và token
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
  },
  actions: {
    // Action để cập nhật state và localStorage sau khi xác thực
    setAuth({ token, user }) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },

    async login(credentials) {
      try {
        const response = await apiService.login(credentials)
        // *** SỬA LỖI: Gọi action setAuth để lưu cả user và token
        this.setAuth(response.data)
        return response // Trả về response để component có thể xử lý tiếp
      } catch (error) {
        console.error('Lỗi đăng nhập:', error)
        throw error // Ném lỗi để component có thể hiển thị
      }
    },

    async register(credentials) {
      try {
        // *** SỬA LỖI: API register không trả về token, chỉ xử lý thành công
        const response = await apiService.register(credentials)
        // Không làm gì với state ở đây, chỉ trả về response thành công
        return response
      } catch (error) {
        console.error('Lỗi đăng ký:', error)
        throw error
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // *** TỐI ƯU: Điều hướng ở đây là hợp lý vì logout là một hành động toàn cục
      // và luôn yêu cầu chuyển về trang chủ.
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push({ name: 'home' })
      }
    },
  },
})
