import { ref, readonly } from 'vue'

// State này sẽ là global trong toàn bộ ứng dụng
const toasts = ref([])

let toastCounter = 0

/**
 * Composable để quản lý hệ thống thông báo (toast).
 */
export function useToasts() {
  /**
   * Thêm một thông báo mới vào danh sách.
   * @param {string} message - Nội dung thông báo.
   * @param {string} [variant='info'] - Kiểu thông báo ('success', 'danger', 'warning', 'info').
   * @param {number} [duration=5000] - Thời gian hiển thị (ms).
   */
  const addToast = (message, variant = 'info', duration = 5000) => {
    const id = toastCounter++
    toasts.value.push({ id, message, variant })

    // Tự động xóa thông báo sau một khoảng thời gian
    setTimeout(() => removeToast(id), duration)
  }

  /**
   * Xóa một thông báo khỏi danh sách.
   * @param {number} id - ID của thông báo cần xóa.
   */
  const removeToast = (id) => {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts: readonly(toasts), // Chỉ cho phép đọc state từ bên ngoài
    addToast,
    removeToast,
  }
}
