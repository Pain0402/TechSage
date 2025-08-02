<script setup>
import { ref } from 'vue';
import apiService from '@/services/api.service';
import DocumentUploader from '@/components/upload/DocumentUploader.vue';
import ConfirmationModal from '@/components/base/ConfirmationModal.vue';
// *** CẬP NHẬT: Import composable toast ***
import { useToasts } from '@/composables/useToasts';

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  documents: { type: Array, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits(['document-uploaded', 'request-summary', 'request-quiz', 'document-deleted']);

const { addToast } = useToasts();
const isUploaderVisible = ref(false);
const isDeleteModalVisible = ref(false);
const documentToDelete = ref(null);

const handleUploadSuccess = (newDocument) => {
  emit('document-uploaded', newDocument);
  addToast('Tài liệu đã được tải lên và đang được xử lý.', 'success');
};

const openDeleteModal = (doc) => {
  documentToDelete.value = doc;
  isDeleteModalVisible.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalVisible.value = false;
  documentToDelete.value = null;
};

const confirmDelete = async () => {
  if (!documentToDelete.value) return;
  try {
    await apiService.deleteDocument(documentToDelete.value.id);
    emit('document-deleted', documentToDelete.value.id);
    // *** CẬP NHẬT: Hiển thị thông báo thành công ***
    addToast(`Đã xóa thành công tài liệu '${documentToDelete.value.file_name}'.`, 'success');
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu:", error);
    // *** CẬP NHẬT: Hiển thị thông báo lỗi ***
    addToast('Xóa tài liệu thất bại. Vui lòng thử lại.', 'danger');
  } finally {
    closeDeleteModal();
  }
};
</script>

<template>
  <div class="document-list-panel d-flex flex-column h-100 p-3">
    <h5 class="fw-bold text-white mb-3">Tài liệu dự án</h5>

    <div class="mb-3">
      <button @click="isUploaderVisible = true"
        class="btn btn-primary w-100 d-flex align-items-center justify-content-center">
        <i class="bi bi-cloud-arrow-up-fill me-2"></i>
        Upload Document
      </button>
    </div>

    <div class="list-group list-group-flush flex-grow-1 overflow-auto">
      <div v-for="doc in documents" :key="doc.id" class="list-group-item document-item">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center text-truncate me-2">
            <i class="bi bi-file-earmark-text-fill me-2 text-secondary"></i>
            <span class="text-white text-truncate">{{ doc.file_name }}</span>
          </div>
          <span v-if="doc.status === 'processing'" class="spinner-border spinner-border-sm text-primary"
            role="status"></span>
          <i v-else-if="doc.status === 'completed'" class="bi bi-check-circle-fill text-success"></i>
          <i v-else-if="doc.status === 'failed'" class="bi bi-x-circle-fill text-danger"></i>
        </div>
        <div class="document-actions mt-2">
          <button @click="emit('request-summary', doc.id)" class="btn btn-sm btn-action" title="Tóm tắt">
            <i class="bi bi-card-text"></i>
          </button>
          <button @click="emit('request-quiz', doc.id)" class="btn btn-sm btn-action" title="Tạo Quiz">
            <i class="bi bi-patch-question-fill"></i>
          </button>
          <button @click="openDeleteModal(doc)" class="btn btn-sm btn-action text-danger" title="Xóa">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <DocumentUploader :show="isUploaderVisible" :project-id="projectId" @close="isUploaderVisible = false"
    @upload-success="handleUploadSuccess" />

  <ConfirmationModal :show="isDeleteModalVisible" title="Xác nhận xóa tài liệu"
    :message="`Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu '${documentToDelete?.file_name}' không? Hành động này không thể hoàn tác.`"
    confirm-text="Xóa tài liệu" variant="danger" @close="closeDeleteModal" @confirm="confirmDelete" />
</template>

<style scoped>
.document-list-panel {
  background-color: #2D3748;
}

.btn-primary {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
}

.list-group-item {
  background-color: transparent;
  border-color: #4A5568;
  padding: 0.75rem;
  transition: background-color 0.2s ease;
}

.document-item:hover {
  background-color: rgba(79, 209, 197, 0.05);
}

.text-secondary {
  color: #A0AEC0 !important;
}

.text-success {
  color: #48BB78 !important;
}

.text-danger {
  color: #F56565 !important;
}

.text-primary {
  color: #81e6d9 !important;
}

.document-actions {
  display: none;
  gap: 0.5rem;
}

.document-item:hover .document-actions {
  display: flex;
}

.btn-action {
  color: #A0AEC0;
  background-color: rgba(74, 85, 104, 0.5);
}

.btn-action:hover {
  color: #fff;
  background-color: rgba(79, 209, 197, 0.2);
}

.btn-action.text-danger:hover {
  background-color: rgba(245, 101, 101, 0.2);
}
</style>
