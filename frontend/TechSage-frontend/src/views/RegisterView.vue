<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store'; // Sử dụng authStore để đăng ký
import AuthLayout from '@/layouts/AuthLayout.vue';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref(null);

const handleRegister = async () => {
  // Reset lỗi
  errorMessage.value = null;

  // Kiểm tra mật khẩu có khớp không
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không khớp.';
    return;
  }
  // Kiểm tra độ dài mật khẩu
  if (password.value.length < 6) {
    errorMessage.value = 'Mật khẩu phải có ít nhất 6 ký tự.';
    return;
  }

  isLoading.value = true;
  try {
    await authStore.register({ email: email.value, password: password.value });
    router.push({ name: 'home' });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Email đã tồn tại hoặc có lỗi xảy ra.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <AuthLayout>
    <div class="text-center mb-4">
      <h1 class="h3 mb-1 fw-bold text-white">Create Your Account</h1>
      <p class="text-secondary-light">Start your journey with TechSage today</p>
    </div>

    <form @submit.prevent="handleRegister" class="needs-validation" novalidate>
      <div v-if="errorMessage" class="alert alert-danger p-2 text-center small" role="alert">
        {{ errorMessage }}
      </div>

      <div class="form-floating mb-3">
        <input type="email" class="form-control" id="email" placeholder="name@example.com" v-model="email" required>
        <label for="email">Email Address</label>
      </div>

      <div class="form-floating mb-3">
        <input type="password" class="form-control" id="password" placeholder="Password" v-model="password" required>
        <label for="password">Password (min. 6 characters)</label>
      </div>

      <div class="form-floating mb-3">
        <input type="password" class="form-control" id="confirmPassword" placeholder="Confirm Password"
          v-model="confirmPassword" required>
        <label for="confirmPassword">Confirm Password</label>
      </div>

      <div class="d-grid mt-4">
        <button class="btn btn-gradient fw-semibold" type="submit" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
          <span v-else>Create Account</span>
        </button>
      </div>
    </form>

    <div class="text-center mt-4">
      <p class="text-secondary-light small">Already have an account?
        <router-link :to="{ name: 'login' }" class="fw-medium link-gradient">Log in</router-link>
      </p>
    </div>
  </AuthLayout>
</template>

<style scoped>
/* Tái sử dụng style từ LoginView để đảm bảo tính nhất quán */
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

.text-secondary-light {
  color: #A0AEC0;
}
</style>
