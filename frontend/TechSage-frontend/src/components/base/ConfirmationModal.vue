<script setup>
// Vue
import { ref, watch } from 'vue';

// --- Props & Emits ---
const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to perform this action?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  variant: {
    type: String,
    default: 'danger'
  }, // 'danger', 'warning', 'info'
});

const emit = defineEmits(['close', 'confirm']);

// --- Component State ---
const modalInstance = ref(null);

// --- Methods ---
const handleConfirm = () => {
  emit('confirm');
};

// --- Watchers ---
// Manages the Bootstrap modal instance based on the `show` prop
watch(() => props.show, (newVal) => {
  const modalEl = document.getElementById('confirmationModal');
  if (!modalEl) return;

  if (newVal) {
    // eslint-disable-next-line no-undef
    modalInstance.value = new bootstrap.Modal(modalEl);
    modalInstance.value.show();
    // Sync state if the user closes the modal via backdrop click or Esc key
    modalEl.addEventListener('hidden.bs.modal', () => emit('close'), { once: true });
  } else {
    if (modalInstance.value) {
      modalInstance.value.hide();
    }
  }
});
</script>

<template>
  <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title" id="confirmationModalLabel">{{ title }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">{{ cancelText }}</button>
          <button type="button" class="btn" :class="`btn-${variant}`" @click="handleConfirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  background-color: #2D3748;
  color: #F7FAFC;
  border: 1px solid #4A5568;
}

.btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}
</style>