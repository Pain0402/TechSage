<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

// --- Props & Emits ---
const props = defineProps({
  initialMode: {
    type: String,
    default: 'login', // 'login' or 'register'
  },
});

const emit = defineEmits(['close', 'authSuccess']);

// --- State Management ---
const authStore = useAuthStore();
const currentMode = ref(props.initialMode); // 'login' or 'register'
const isLoading = ref(false);
const errorMessage = ref('');

// Form data
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

// --- Computed Properties ---
const isLoginMode = computed(() => currentMode.value === 'login');
const modalTitle = computed(() => isLoginMode.value ? 'Đăng nhập' : 'Tạo tài khoản');
const submitButtonText = computed(() => isLoginMode.value ? 'Đăng nhập' : 'Đăng ký');

// --- Functions ---
const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const switchMode = () => {
  currentMode.value = isLoginMode.value ? 'register' : 'login';
  errorMessage.value = ''; // Reset lỗi khi chuyển mode
};

const handleSubmit = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (isLoginMode.value) {
      // Logic đăng nhập
      await authStore.login({ email: email.value, password: password.value });
    } else {
      // Logic đăng ký
      if (password.value !== confirmPassword.value) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }
      await authStore.register({ email: email.value, password: password.value });
    }
    emit('authSuccess');
    closeModal();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal-overlay" @mousedown.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button @click="closeModal" class="close-btn" title="Đóng"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input id="password" v-model="password" type="password" placeholder="••••••••" required>
          </div>
          <div v-if="!isLoginMode" class="form-group">
            <label for="confirmPassword">Xác nhận mật khẩu</label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" placeholder="••••••••" required>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
            <span v-else>{{ submitButtonText }}</span>
          </button>
        </form>
      </div>
      <div class="modal-footer">
        <p>
          {{ isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?' }}
          <button @click="switchMode" class="switch-mode-btn">
            {{ isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Import Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");

/* Kế thừa biến màu từ các component trước */
:root {
  --c-primary: #34d399;
  --c-primary-hover: #2bb989;
  --c-text-primary: #1f2937;
  --c-text-secondary: #4b5563;
  --c-border: rgba(31, 41, 55, 0.1);
  --c-error: #ef4444;
  --radius-md: 12px;
  --radius-sm: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 420px;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.modal-header h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--c-text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--c-text-primary);
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2);
}

.error-message {
  color: var(--c-error);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background-color: var(--c-primary);
  color: white;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--c-primary-hover);
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal-footer {
  text-align: center;
  margin-top: 2rem;
  color: var(--c-text-secondary);
}

.switch-mode-btn {
  background: none;
  border: none;
  color: var(--c-primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.switch-mode-btn:hover {
  text-decoration: underline;
}
</style>
