<script setup>
import { ref, watch } from 'vue';
import apiService from '@/services/api.service';

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'upload-success']);

// --- State ---
const selectedFile = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref(null);
const isDragOver = ref(false);
const modalInstance = ref(null);

// --- Methods ---
const handleFileSelect = (event) => {
  selectFile(event.target.files[0]);
};

const handleFileDrop = (event) => {
  isDragOver.value = false;
  selectFile(event.dataTransfer.files[0]);
};

const selectFile = (file) => {
  if (!file) return;
  // Có thể thêm kiểm tra định dạng file ở đây
  selectedFile.value = file;
  errorMessage.value = null;
};

const triggerFileInput = () => {
  document.getElementById('fileInput').click();
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  isUploading.value = true;
  uploadProgress.value = 0;
  errorMessage.value = null;

  const formData = new FormData();
  formData.append('documentFile', selectedFile.value);
  formData.append('projectId', props.projectId);

  try {
    const response = await apiService.uploadDocument(formData, {
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      },
    });
    // Gửi sự kiện thành công với dữ liệu tài liệu mới
    emit('upload-success', response.data.document);
    closeModal();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Tải file thất bại. Vui lòng thử lại.';
  } finally {
    isUploading.value = false;
  }
};

const closeModal = () => {
  if (isUploading.value) return;
  selectedFile.value = null;
  uploadProgress.value = 0;
  errorMessage.value = null;
  emit('close');
};

// Quản lý hiển thị modal bằng Bootstrap JS
watch(() => props.show, (newVal) => {
  if (newVal) {
    const modalEl = document.getElementById('uploaderModal');
    // Cần import bootstrap vào main.js hoặc dùng CDN
    // eslint-disable-next-line no-undef
    modalInstance.value = new bootstrap.Modal(modalEl);
    modalInstance.value.show();
    // Lắng nghe sự kiện đóng modal của Bootstrap
    modalEl.addEventListener('hidden.bs.modal', closeModal, { once: true });
  } else {
    if (modalInstance.value) {
      modalInstance.value.hide();
    }
  }
});
</script>

<template>
  <div class="modal fade" id="uploaderModal" tabindex="-1" aria-labelledby="uploaderModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="uploaderModalLabel">Tải lên tài liệu mới</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Vùng kéo thả -->
          <div class="drop-zone" :class="{ 'drag-over': isDragOver }" @click="triggerFileInput"
            @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleFileDrop">
            <i class="bi bi-cloud-arrow-up-fill display-4 text-secondary"></i>
            <p class="mb-0 mt-2">Kéo và thả file vào đây, hoặc nhấn để chọn file</p>
            <p class="small text-secondary">Hỗ trợ PDF, TXT, MD...</p>
            <input type="file" id="fileInput" @change="handleFileSelect" hidden>
          </div>

          <!-- Hiển thị file đã chọn -->
          <div v-if="selectedFile" class="mt-3 selected-file-info">
            <i class="bi bi-file-earmark-text-fill me-2"></i>
            <span>{{ selectedFile.name }}</span>
            <span class="text-secondary ms-2">({{ (selectedFile.size / 1024).toFixed(2) }} KB)</span>
          </div>

          <!-- Thanh tiến trình -->
          <div v-if="isUploading" class="progress mt-3" style="height: 10px;">
            <div class="progress-bar" role="progressbar" :style="{ width: uploadProgress + '%' }"
              :aria-valuenow="uploadProgress" aria-valuemin="0" aria-valuemax="100">
            </div>
          </div>

          <!-- Thông báo lỗi -->
          <div v-if="errorMessage" class="alert alert-danger mt-3 p-2 text-center">
            {{ errorMessage }}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isUploading">Hủy</button>
          <button type="button" class="btn btn-primary" @click="uploadFile" :disabled="!selectedFile || isUploading">
            <span v-if="isUploading" class="spinner-border spinner-border-sm me-2" role="status"
              aria-hidden="true"></span>
            Tải lên
          </button>
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

.modal-header {
  border-bottom-color: #4A5568;
}

.modal-footer {
  border-top-color: #4A5568;
}

.btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}

.drop-zone {
  border: 2px dashed #4A5568;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.drop-zone:hover,
.drop-zone.drag-over {
  background-color: rgba(79, 209, 197, 0.05);
  border-color: #4fd1c5;
}

.text-secondary {
  color: #A0AEC0 !important;
}

.selected-file-info {
  background-color: #1A202C;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.progress-bar {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
}

.btn-primary {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
}
</style>
