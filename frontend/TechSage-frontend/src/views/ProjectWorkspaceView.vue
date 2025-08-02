<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '@/services/api.service';

import DocumentList from '@/components/document/DocumentList.vue';
import ChatInterface from '@/components/chat/ChatInterface.vue';
import ContextPanel from '@/components/context/ContextPanel.vue';

const route = useRoute();
const project = ref(null);
const documents = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);

const contextState = ref({
  view: 'idle',
  data: null,
  isLoading: false,
  error: null,
});

const projectId = computed(() => route.params.id);

const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const [projectResponse, documentsResponse] = await Promise.all([
      apiService.getProject(projectId.value),
      apiService.getDocuments(projectId.value)
    ]);
    project.value = projectResponse.data;
    documents.value = documentsResponse.data;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu không gian làm việc:", error);
    errorMessage.value = "Không thể tải được dự án. Vui lòng thử lại hoặc quay lại trang tổng quan.";
  } finally {
    isLoading.value = false;
  }
};

const handleDocumentUploaded = (newDocument) => {
  documents.value.unshift(newDocument);
};

// *** CẬP NHẬT: Hàm xử lý khi tài liệu bị xóa ***
const handleDocumentDeleted = (deletedDocumentId) => {
  documents.value = documents.value.filter(doc => doc.id !== deletedDocumentId);
  // Có thể thêm logic reset ContextPanel nếu tài liệu đang được xem bị xóa
  if (contextState.value.documentId === deletedDocumentId) {
    contextState.value = { view: 'idle', data: null, isLoading: false, error: null };
  }
};

const handleSummarizeRequest = async (documentId) => {
  contextState.value = { view: 'summary', data: null, isLoading: true, error: null, documentId: documentId };
  try {
    const response = await apiService.summarizeDocument(documentId);
    contextState.value.data = response.data.summary;
  } catch (error) {
    console.error("Lỗi khi tạo tóm tắt:", error);
    contextState.value.error = "Không thể tạo bản tóm tắt cho tài liệu này.";
  } finally {
    contextState.value.isLoading = false;
  }
};

const handleQuizRequest = async (documentId) => {
  contextState.value = { view: 'quiz', data: null, isLoading: true, error: null, documentId: documentId };
  try {
    const payload = { documentIds: [documentId] };
    const response = await apiService.generateQuiz(payload);
    contextState.value.data = response.data;
  } catch (error) {
    console.error("Lỗi khi tạo quiz:", error);
    contextState.value.error = "Không thể tạo câu hỏi trắc nghiệm từ tài liệu này.";
  } finally {
    contextState.value.isLoading = false;
  }
};

onMounted(fetchData);

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchData();
    // Reset context panel
    contextState.value = { view: 'idle', data: null, isLoading: false, error: null };
  }
});
</script>

<template>
  <div class="workspace-view h-100">
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center h-100">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
      <router-link :to="{ name: 'dashboard' }" class="alert-link ms-2">Quay lại Dashboard</router-link>
    </div>

    <div v-else class="container-fluid h-100 p-0">
      <div class="row g-0 h-100">
        <div class="col-lg-3 border-end border-secondary-subtle">
          <DocumentList :documents="documents" :project-id="projectId" @document-uploaded="handleDocumentUploaded"
            @document-deleted="handleDocumentDeleted" @request-summary="handleSummarizeRequest"
            @request-quiz="handleQuizRequest" />
        </div>

        <div class="col-lg-6">
          <ChatInterface :project-id="projectId" />
        </div>

        <div class="col-lg-3 border-start border-secondary-subtle">
          <ContextPanel :state="contextState" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-view {
  color: #F7FAFC;
}

.spinner-border.text-primary {
  color: #4fd1c5 !important;
}

.border-secondary-subtle {
  --bs-border-color: #4A5568;
}
</style>
