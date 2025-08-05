<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue'; // Import layout mới

// --- State ---
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref(null);

// --- Composables ---
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// --- Methods ---
const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ email và mật khẩu.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.login({ email: email.value, password: password.value });
    const redirectPath = route.query.redirect || '/'; // Chuyển về trang chủ hoặc trang được yêu cầu
    router.push(redirectPath);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Email hoặc mật khẩu không chính xác.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <AuthLayout>
    <div class="text-center mb-4">
      <h1 class="h3 mb-1 fw-bold text-white">Welcome Back</h1>
      <p class="text-secondary-light">Login to continue with TechSage</p>
    </div>

    <!-- Form Đăng nhập -->
    <form @submit.prevent="handleLogin" class="needs-validation" novalidate>
      <!-- Thông báo lỗi -->
      <div v-if="errorMessage" class="alert alert-danger p-2 text-center small" role="alert">
        {{ errorMessage }}
      </div>

      <!-- Email -->
      <div class="form-floating mb-3">
        <input type="email" class="form-control" id="emailInput" placeholder="name@example.com" v-model="email"
          required>
        <label for="emailInput">Email Address</label>
      </div>

      <!-- Mật khẩu -->
      <div class="form-floating mb-3">
        <input type="password" class="form-control" id="passwordInput" placeholder="Password" v-model="password"
          required>
        <label for="passwordInput">Password</label>
      </div>

      <!-- Quên mật khẩu -->
      <div class="d-flex justify-content-end mb-4">
        <a href="#" class="link-secondary small">Forgot Password?</a>
      </div>

      <!-- Nút Đăng nhập -->
      <div class="d-grid">
        <button class="btn btn-gradient fw-semibold" type="submit" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span v-else>Login</span>
        </button>
      </div>
    </form>

    <!-- Link sang trang Đăng ký -->
    <p class="text-center text-secondary-light mt-4 mb-0 small">
      Don't have an account?
      <router-link :to="{ name: 'register' }" class="fw-medium link-gradient">Sign up now</router-link>
    </p>
  </AuthLayout>
</template>

<style scoped>
/* ===== Form Styling ===== */
.form-control {
  background-color: #1A202C;
  border-color: #4A5568;
  color: #F7FAFC;
  border-radius: 0.5rem;
}

.form-control:focus {
  background-color: #1A202C;
  border-color: #4fd1c5;
  /* Primary Gradient Color */
  box-shadow: 0 0 0 0.25rem rgba(79, 209, 197, 0.25);
  color: #F7FAFC;
}

.form-floating>label {
  color: #A0AEC0;
  /* Secondary Text Color */
}

.form-floating>.form-control:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px #1A202C inset !important;
  -webkit-text-fill-color: #F7FAFC !important;
}

/* ===== Button & Links ===== */
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

.text-secondary-light {
  color: #A0AEC0;
}
</style>
