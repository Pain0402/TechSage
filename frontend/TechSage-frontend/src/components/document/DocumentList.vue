<script setup>
import { ref } from 'vue';

// Services & Composables
import apiService from '@/services/api.service';
import { useToasts } from '@/composables/useToasts';
import { usePolling } from '@/composables/usePolling'; // Import composable polling

// Components
import DocumentUploader from '@/components/upload/DocumentUploader.vue';
import ConfirmationModal from '@/components/base/ConfirmationModal.vue';

// Props & Emits
// eslint-disable-next-line no-unused-vars
const props = defineProps({
  documents: { type: Array, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits([
  'document-uploaded',
  'request-summary',
  'request-quiz',
  'document-deleted',
  'document-updated' // Thêm event mới để thông báo khi trạng thái được cập nhật
]);

// Composables
const { addToast } = useToasts();

// Component State
const isUploaderVisible = ref(false);
const isDeleteModalVisible = ref(false);
const documentToDelete = ref(null);

// --- Polling Logic ---
/**
 * Hàm hành động cho poller, gọi API để lấy trạng thái mới nhất của tài liệu.
 */
const checkDocumentStatus = async (docId) => {
  try {
    // Lưu ý: Cần thêm hàm getDocument vào api.service.js
    const response = await apiService.getDocument(docId);
    // Nếu trạng thái không còn là 'processing', trả về dữ liệu để dừng polling
    if (response.data && response.data.status !== 'processing') {
      return { data: response.data };
    }
    // Trả về null để tiếp tục polling
    return null;
  } catch (error) {
    console.error(`Polling error for document ${docId}:`, error);
    // Tiếp tục polling ngay cả khi có lỗi mạng tạm thời
    return null;
  }
};

// --- Methods ---

const handleUploadSuccess = (newDocument) => {
  emit('document-uploaded', newDocument);
  addToast('Document has been uploaded and is being processed.', 'success');

  // Bắt đầu polling để theo dõi trạng thái của tài liệu mới
  const { start } = usePolling(
    () => checkDocumentStatus(newDocument.id),
    (completedDocument) => {
      // Khi polling hoàn tất, phát sự kiện lên component cha để cập nhật trạng thái
      emit('document-updated', completedDocument);
      addToast(`Document '${completedDocument.file_name}' has been processed.`, 'success');
    },
    5000 // Thăm dò sau mỗi 5 giây
  );
  start();
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
    addToast(`Successfully deleted document '${documentToDelete.value.file_name}'.`, 'success');
  } catch (error) {
    console.error("Error deleting document:", error);
    addToast('Failed to delete document. Please try again.', 'danger');
  } finally {
    closeDeleteModal();
  }
};
</script>

<template>
  <div class="document-list-panel d-flex flex-column h-100 p-3">
    <h5 class="fw-bold text-white mb-3">Project Documents</h5>

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
          <button @click="emit('request-summary', doc.id)" class="btn btn-sm btn-action" title="Summarize">
            <i class="bi bi-card-text"></i>
          </button>
          <button @click="emit('request-quiz', doc.id)" class="btn btn-sm btn-action" title="Generate Quiz">
            <i class="bi bi-patch-question-fill"></i>
          </button>
          <button @click="openDeleteModal(doc)" class="btn btn-sm btn-action text-danger" title="Delete">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <DocumentUploader :show="isUploaderVisible" :project-id="projectId" @close="isUploaderVisible = false"
    @upload-success="handleUploadSuccess" />

  <ConfirmationModal :show="isDeleteModalVisible" title="Confirm Document Deletion"
    :message="`Are you sure you want to permanently delete the document '${documentToDelete?.file_name}'? This action cannot be undone.`"
    confirm-text="Delete Document" variant="danger" @close="closeDeleteModal" @confirm="confirmDelete" />
</template>

<style scoped>
.document-list-panel {
  background-color: #2D3748;
  border-radius: 15px;
  max-height: 570px;
  min-height: 570px;
  transition: transform 0.3s ease-in-out;
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
