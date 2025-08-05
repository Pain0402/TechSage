<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';

// --- State ---
const mode = ref('login'); // 'login' or 'register'
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref(null);

// --- Composables ---
const router = useRouter();
const authStore = useAuthStore();

// --- Computed Properties ---
const isLoginMode = computed(() => mode.value === 'login');

// --- Methods ---
const toggleMode = () => {
  mode.value = isLoginMode.value ? 'register' : 'login';
  errorMessage.value = null; // Xóa thông báo lỗi khi chuyển mode
};

const handleSubmit = async () => {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    if (isLoginMode.value) {
      // --- Login Logic ---
      await authStore.login({ email: email.value, password: password.value });
      router.push('/'); // Chuyển hướng đến trang chính sau khi đăng nhập
    } else {
      // --- Register Logic ---
      if (password.value !== confirmPassword.value) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }
      if (password.value.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
      }
      await authStore.register({ email: email.value, password: password.value });
      // Đăng ký thành công, chuyển sang mode login và thông báo
      mode.value = 'login';
      // Có thể thêm một thông báo thành công ở đây
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <AuthLayout>
    <!-- Title -->
    <div class="text-center mb-4">
      <h1 class="h3 mb-1 fw-bold text-white">
        {{ isLoginMode ? 'Welcome Back' : 'Create Your Account' }}
      </h1>
      <p class="text-secondary-light">
        {{ isLoginMode ? 'Login to continue with TechSage' : 'Start your journey with TechSage today' }}
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" novalidate>
      <div v-if="errorMessage" class="alert alert-danger p-2 text-center small mb-3" role="alert">
        {{ errorMessage }}
      </div>

      <!-- Common Fields -->
      <div class="form-floating mb-3">
        <input type="email" class="form-control" id="emailInput" placeholder="name@example.com" v-model="email"
          required>
        <label for="emailInput">Email Address</label>
      </div>
      <div class="form-floating mb-3">
        <input type="password" class="form-control" id="passwordInput" placeholder="Password" v-model="password"
          required>
        <label for="passwordInput">Password</label>
      </div>

      <!-- Register-only Field -->
      <div v-if="!isLoginMode" class="form-floating mb-3">
        <input type="password" class="form-control" id="confirmPasswordInput" placeholder="Confirm Password"
          v-model="confirmPassword" required>
        <label for="confirmPasswordInput">Confirm Password</label>
      </div>

      <!-- Forgot Password Link (Login only) -->
      <div v-if="isLoginMode" class="d-flex justify-content-end mb-4">
        <a href="#" class="link-secondary small">Forgot Password?</a>
      </div>

      <!-- Submit Button -->
      <div class="d-grid" :class="{ 'mt-4': !isLoginMode }">
        <button class="btn btn-gradient fw-semibold" type="submit" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span v-else>{{ isLoginMode ? 'Login' : 'Create Account' }}</span>
        </button>
      </div>
    </form>

    <!-- Toggle Mode Link -->
    <p class="text-center text-secondary-light mt-4 mb-0 small">
      <span v-if="isLoginMode">Don't have an account? </span>
      <span v-else>Already have an account? </span>
      <a href="#" @click.prevent="toggleMode" class="fw-medium link-gradient">
        {{ isLoginMode ? 'Sign up now' : 'Log in' }}
      </a>
    </p>
  </AuthLayout>
</template>

<style scoped>
/* ===== Kế thừa và thống nhất style ===== */
.text-secondary-light {
  color: #A0AEC0;
}

.form-control {
  background-color: #1A202C;
  border-color: #4A5568;
  color: #F7FAFC;
  border-radius: 0.5rem;
}

.form-control:focus {
  background-color: #1A202C;
  border-color: #4fd1c5;
  box-shadow: 0 0 0 0.25rem rgba(79, 209, 197, 0.25);
  color: #F7FAFC;
}

.form-floating>label {
  color: #A0AEC0;
}

.form-floating>.form-control:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px #1A202C inset !important;
  -webkit-text-fill-color: #F7FAFC !important;
}

.btn-gradient {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
  color: #1A202C;
  padding: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(129, 230, 217, 0.1);
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(129, 230, 217, 0.2);
  color: #1A202C;
}

.link-gradient {
  background: -webkit-linear-gradient(#4fd1c5, #81e6d9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
  font-weight: 600;
}

.link-secondary {
  color: #A0AEC0 !important;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link-secondary:hover {
  color: #F7FAFC !important;
}
</style>
