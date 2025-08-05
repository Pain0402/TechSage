import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const apiClient = axios.create({
  // *** TỐI ƯU: Sử dụng biến môi trường cho baseURL
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor để đính kèm token
apiClient.interceptors.request.use(
  (config) => {
    // Không cần khởi tạo store ở top-level, có thể lấy trong interceptor
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// *** TỐI ƯU: Response interceptor để xử lý lỗi tập trung
apiClient.interceptors.response.use(
  (response) => {
    // Trả về response nếu không có lỗi
    return response
  },
  (error) => {
    const authStore = useAuthStore()

    // Xử lý lỗi 401 (Unauthorized) - token không hợp lệ hoặc hết hạn
    if (error.response && error.response.status === 401) {
      // Gọi action logout từ store để dọn dẹp state và localStorage
      authStore.logout()
      // Có thể thêm thông báo cho người dùng ở đây
      console.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
    }

    // Ném lỗi để các lệnh gọi .catch() ở component vẫn có thể xử lý
    return Promise.reject(error)
  },
)

// Giữ nguyên cấu trúc các hàm, nhưng giờ chúng sẽ được hưởng lợi từ việc xử lý lỗi tập trung
export default {
  register(credentials) {
    return apiClient.post('/auth/register', credentials)
  },
  login(credentials) {
    return apiClient.post('/auth/login', credentials)
  },

  // Projects
  getProjects() {
    return apiClient.get('/projects')
  },
  getProject(projectId) {
    return apiClient.get(`/projects/${projectId}`)
  },
  createProject(projectData) {
    return apiClient.post('/projects', projectData)
  },
  // *** TỐI ƯU: Thay đổi route query để nhất quán với backend đã sửa
  queryProject(payload) {
    return apiClient.post('/projects/query', payload)
  },
  generateQuiz(payload) {
    return apiClient.post('/projects/generate-quiz', payload)
  },
  deleteProject(projectId) {
    return apiClient.delete(`/projects/${projectId}`)
  },

  // Documents
  getDocuments(projectId) {
    return apiClient.get(`/projects/${projectId}/documents`)
  },
  uploadDocument(formData) {
    return apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  summarizeDocument(documentId) {
    return apiClient.post(`/documents/${documentId}/summarize`)
  },
  deleteDocument(documentId) {
    return apiClient.delete(`/documents/${documentId}`)
  },
  getDocument(documentId) {
    return apiClient.get(`/documents/${documentId}`)
  },
}
