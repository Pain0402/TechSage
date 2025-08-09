<script setup>
import { ref, watch } from 'vue';
import apiService from '@/services/api.service';

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close', 'project-created']);

const name = ref('');
const description = ref('');
const isLoading = ref(false);
const errorMessage = ref(null);
const modalInstance = ref(null);

const handleSubmit = async () => {
  if (!name.value.trim()) {
    errorMessage.value = 'Tên dự án không được để trống.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const response = await apiService.createProject({ name: name.value, description: description.value });
    emit('project-created', response.data);
    closeModal();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không thể tạo dự án. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (isLoading.value) return;
  name.value = '';
  description.value = '';
  errorMessage.value = null;
  emit('close');
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    const modalEl = document.getElementById('projectModal');
    // eslint-disable-next-line no-undef
    modalInstance.value = new bootstrap.Modal(modalEl);
    modalInstance.value.show();
    modalEl.addEventListener('hidden.bs.modal', closeModal, { once: true });
  } else {
    if (modalInstance.value) {
      modalInstance.value.hide();
    }
  }
});
</script>

<template>
  <div class="modal fade" id="projectModal" tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <form @submit.prevent="handleSubmit" class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="projectModalLabel">Create a new project</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger p-2 text-center">{{ errorMessage }}</div>

          <div class="mb-3">
            <label for="projectName" class="form-label">Project name</label>
            <input type="text" class="form-control" id="projectName" v-model="name" required>
          </div>

          <div class="mb-3">
            <label for="projectDescription" class="form-label">Description (Optional)</label>
            <textarea class="form-control" id="projectDescription" rows="3" v-model="description"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isLoading">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
              aria-hidden="true"></span>
            Create Project
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-content,
.form-control {
  background-color: #2D3748;
  color: #F7FAFC;
  border-color: #4A5568;
}

.modal-header,
.modal-footer {
  border-color: #4A5568;
}

.btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}

.btn-primary {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
}
</style>
