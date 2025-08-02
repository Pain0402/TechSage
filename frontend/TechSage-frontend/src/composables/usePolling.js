import { ref, onUnmounted } from 'vue'

/**
 * Một composable để thực hiện việc thăm dò (polling) định kỳ.
 * @param {Function} action - Hàm bất đồng bộ sẽ được thực thi trong mỗi lần lặp.
 * @param {Function} onConditionMet - Hàm callback được gọi khi điều kiện dừng được đáp ứng.
 * @param {number} intervalMs - Khoảng thời gian giữa các lần lặp (tính bằng ms).
 */
export function usePolling(action, onConditionMet, intervalMs = 3000) {
  const isPolling = ref(false)
  let intervalId = null

  const start = async (...args) => {
    if (isPolling.value) return

    isPolling.value = true

    const execute = async () => {
      const shouldStop = await action(...args)
      if (shouldStop) {
        stop()
        if (onConditionMet) {
          onConditionMet(shouldStop.data) // Truyền dữ liệu kết quả ra ngoài
        }
      }
    }

    await execute() // Chạy ngay lần đầu tiên
    if (isPolling.value) {
      intervalId = setInterval(execute, intervalMs)
    }
  }

  const stop = () => {
    if (!isPolling.value) return
    isPolling.value = false
    clearInterval(intervalId)
    intervalId = null
  }

  // Tự động dừng polling khi component bị unmount
  onUnmounted(stop)

  return {
    isPolling,
    start,
    stop,
  }
}
