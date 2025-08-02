<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

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

    // Chuyển hướng về trang họ muốn truy cập ban đầu, hoặc về dashboard
    const redirectPath = route.query.redirect || '/app/dashboard';
    router.push(redirectPath);

  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
      <div class="login-card">
        <!-- Logo -->
        <div class="text-center mb-4">
          <img src="@/assets/techsage_logo.png" alt="TechSage Logo" class="logo-img mb-3" />
          <h1 class="h3 mb-0 fw-bold">Chào mừng trở lại</h1>
          <p class="text-secondary">Đăng nhập để tiếp tục với TechSage</p>
        </div>

        <!-- Form Đăng nhập -->
        <form @submit.prevent="handleLogin">
          <!-- Thông báo lỗi -->
          <div v-if="errorMessage" class="alert alert-danger p-2 text-center" role="alert">
            {{ errorMessage }}
          </div>

          <!-- Email -->
          <div class="form-floating mb-3">
            <input type="email" class="form-control" id="emailInput" placeholder="name@example.com" v-model="email"
              required>
            <label for="emailInput">Địa chỉ email</label>
          </div>

          <!-- Mật khẩu -->
          <div class="form-floating mb-3">
            <input type="password" class="form-control" id="passwordInput" placeholder="Password" v-model="password"
              required>
            <label for="passwordInput">Mật khẩu</label>
          </div>

          <!-- Quên mật khẩu -->
          <div class="d-flex justify-content-end mb-4">
            <a href="#" class="link-secondary small">Quên mật khẩu?</a>
          </div>

          <!-- Nút Đăng nhập -->
          <div class="d-grid">
            <button class="btn btn-primary btn-lg fw-semibold" type="submit" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span v-else>Đăng nhập</span>
            </button>
          </div>
        </form>

        <!-- Link sang trang Đăng ký -->
        <p class="text-center text-secondary mt-4 mb-0">
          Chưa có tài khoản?
          <router-link :to="{ name: 'register' }" class="fw-medium link-primary">Đăng ký ngay</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tùy chỉnh Bootstrap cho phù hợp với theme */
.login-card {
  background-color: #2D3748;
  /* Màu nền cho khối nội dung - Slate Gray */
  color: #F7FAFC;
  /* Màu văn bản chính - Off-White */
  padding: 2.5rem;
  border-radius: 1rem;
  border: 1px solid #4A5568;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.logo-img {
  width: 60px;
  height: 60px;
}

.form-control {
  background-color: #1A202C;
  border-color: #4A5568;
  color: #F7FAFC;
}

.form-control:focus {
  background-color: #1A202C;
  border-color: #4fd1c5;
  /* Màu nhấn */
  box-shadow: 0 0 0 0.25rem rgba(79, 209, 197, 0.25);
  color: #F7FAFC;
}

.form-floating>label {
  color: #A0AEC0;
  /* Màu văn bản phụ */
}

.btn-primary {
  --bs-btn-bg: #4fd1c5;
  --bs-btn-border-color: #4fd1c5;
  --bs-btn-hover-bg: #38b2ac;
  --bs-btn-hover-border-color: #38b2ac;
  /* Tạo hiệu ứng gradient cho nút */
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(79, 209, 197, 0.2);
}

.link-primary {
  color: #81e6d9 !important;
  text-decoration: none;
}

.link-primary:hover {
  color: #4fd1c5 !important;
  text-decoration: underline;
}

.link-secondary {
  color: #A0AEC0 !important;
  text-decoration: none;
}

.link-secondary:hover {
  color: #F7FAFC !important;
}
</style>
