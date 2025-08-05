<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
const currentMode = ref(props.initialMode);
const isLoading = ref(false);
const errorMessage = ref('');

// Form data
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

// --- Computed Properties ---
const isLoginMode = computed(() => currentMode.value === 'login');

// --- Functions ---
const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const switchMode = () => {
  currentMode.value = isLoginMode.value ? 'register' : 'login';
  errorMessage.value = ''; // Reset error when switching modes
};

const handleSubmit = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (isLoginMode.value) {
      await authStore.login({ email: email.value, password: password.value });
    } else {
      if (password.value !== confirmPassword.value) {
        throw new Error('Password confirmation does not match.');
      }
      if (password.value.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      await authStore.register({ email: email.value, password: password.value });
    }
    emit('authSuccess');
    closeModal();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'An error occurred.';
  } finally {
    isLoading.value = false;
  }
};

// Handle Escape key to close modal
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="modal-overlay" @mousedown.self="closeModal">
    <div class="auth-card">
      <button @click="closeModal" class="close-btn" title="Close (Esc)">
        <i class="bi bi-x-lg"></i>
      </button>

      <!-- Title -->
      <div class="text-center mb-4">
        <h1 class="h3 mb-1 fw-bold text-white">
          {{ isLoginMode ? 'Welcome Back' : 'Create Account' }}
        </h1>
        <p class="text-secondary-light small">
          {{ isLoginMode ? 'Login to continue' : 'Start your journey' }}
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" novalidate>
        <div v-if="errorMessage" class="alert alert-danger p-2 text-center small mb-3" role="alert">
          {{ errorMessage }}
        </div>

        <!-- Fields -->
        <div class="form-floating mb-3">
          <input type="email" class="form-control" id="modalEmailInput" placeholder="name@example.com" v-model="email"
            required>
          <label for="modalEmailInput">Email Address</label>
        </div>
        <div class="form-floating mb-3">
          <input type="password" class="form-control" id="modalPasswordInput" placeholder="Password" v-model="password"
            required>
          <label for="modalPasswordInput">Password</label>
        </div>
        <div v-if="!isLoginMode" class="form-floating mb-3">
          <input type="password" class="form-control" id="modalConfirmPasswordInput" placeholder="Confirm Password"
            v-model="confirmPassword" required>
          <label for="modalConfirmPasswordInput">Confirm Password</label>
        </div>

        <!-- Submit Button -->
        <div class="d-grid mt-4">
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
        <a href="#" @click.prevent="switchMode" class="fw-medium link-gradient">
          {{ isLoginMode ? 'Sign up' : 'Log in' }}
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ===== Modal Overlay & Card ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(26, 32, 44, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.auth-card {
  position: relative;
  background-color: #2D3748;
  padding: 2.5rem;
  border-radius: 1rem;
  border: 1px solid #4A5568;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  width: 90%;
  max-width: 420px;
  animation: slideIn 0.4s ease-out;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #A0AEC0;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #F7FAFC;
}

/* ===== Animations ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ===== Shared and Consistent Styles ===== */
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

.btn-gradient:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(129, 230, 217, 0.2);
  color: #1A202C;
}

.btn-gradient:disabled {
  cursor: not-allowed;
}

.link-gradient {
  background: -webkit-linear-gradient(#4fd1c5, #81e6d9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
  font-weight: 600;
}
</style>
