<script setup>
import { useToasts } from '@/composables/useToasts';

const { toasts, removeToast } = useToasts();

const iconMap = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};
</script>

<template>
  <div class="toast-container position-fixed top-0 end-0 p-3">
    <div v-for="toast in toasts" :key="toast.id" class="toast show" role="alert" aria-live="assertive"
      aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi me-2" :class="[iconMap[toast.variant], `text-${toast.variant}`]"></i>
          {{ toast.message }}
        </div>
        <button type="button" class="btn-close me-2 m-auto" @click="removeToast(toast.id)" aria-label="Close"></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  z-index: 9999;
}

.toast {
  background-color: #2D3748;
  color: #F7FAFC;
  border: 1px solid #4A5568;
  border-left-width: 5px;
}

.toast.show {
  animation: slide-in 0.5s forwards;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-body {
  font-weight: 500;
}

.btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}

.text-success {
  color: #48BB78 !important;
}

.text-danger {
  color: #F56565 !important;
}

.text-warning {
  color: #ED8936 !important;
}

.text-info {
  color: #81e6d9 !important;
}
</style>
