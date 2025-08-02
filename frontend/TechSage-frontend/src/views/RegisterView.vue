<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiService from '@/services/api.service';

const router = useRouter();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const error = ref(null);

const handleRegister = async () => {
  // Kiểm tra mật khẩu có khớp không
  if (password.value !== confirmPassword.value) {
    error.value = 'Mật khẩu xác nhận không khớp.';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    await apiService.register({ email: email.value, password: password.value });
    alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
    router.push('/login');
  } catch (err) {
    error.value = err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container-fluid d-flex align-items-center justify-content-center vh-100 bg-light">
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card shadow-sm border-0">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <h3 class="fw-bold">Tạo tài khoản mới</h3>
            <p class="text-muted">Bắt đầu hành trình của bạn ngay hôm nay.</p>
          </div>
          
          <form @submit.prevent="handleRegister">
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="form-floating mb-3">
              <input type="email" class="form-control" id="email" placeholder="name@example.com" v-model="email" required>
              <label for="email">Địa chỉ email</label>
            </div>

            <div class="form-floating mb-3">
              <input type="password" class="form-control" id="password" placeholder="Mật khẩu" v-model="password" required>
              <label for="password">Mật khẩu</label>
            </div>
            
            <div class="form-floating mb-3">
              <input type="password" class="form-control" id="confirmPassword" placeholder="Xác nhận mật khẩu" v-model="confirmPassword" required>
              <label for="confirmPassword">Xác nhận mật khẩu</label>
            </div>
            
            <div class="d-grid">
              <button class="btn btn-primary btn-lg" type="submit" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                <span v-else>Đăng ký</span>
              </button>
            </div>
          </form>

          <div class="text-center mt-4">
            <p class="text-muted">Đã có tài khoản? 
              <router-link to="/login">Đăng nhập</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 1rem;
}
</style>