<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
// Import thêm `onBeforeRouteUpdate` từ vue-router
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import apiService from '@/services/api.service';

// Các component con
import DocumentList from '@/components/document/DocumentList.vue';
import ChatInterface from '@/components/chat/ChatInterface.vue';
import ContextPanel from '@/components/context/ContextPanel.vue';

// --- Composables ---
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// --- Trạng thái của Component ---
const project = ref(null);
const documents = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);
const isUserMenuOpen = ref(false);
const isLeftPanelOpen = ref(false);
const isRightPanelOpen = ref(false);

const contextState = ref({
  view: 'idle', // 'idle', 'summary', 'quiz'
  data: null,
  isLoading: false,
  error: null,
});

// --- Các phương thức ---

// Sửa đổi `fetchData` để nhận `projectId` làm tham số
const fetchData = async (projectId) => {
  // Kiểm tra nếu không có projectId thì dừng lại
  if (!projectId) {
    isLoading.value = false;
    errorMessage.value = "Không tìm thấy ID của dự án.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;
  console.log("Đang tải dữ liệu cho dự án:", projectId);

  try {
    // Sử dụng `projectId` được truyền vào
    const [projectResponse, documentsResponse] = await Promise.all([
      apiService.getProject(projectId),
      apiService.getDocuments(projectId)
    ]);
    project.value = projectResponse.data;
    documents.value = documentsResponse.data;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu workspace:", error);
    errorMessage.value = "Không thể tải được dự án. Vui lòng thử lại hoặc quay lại trang tổng quan.";
  } finally {
    isLoading.value = false;
  }
};

const handleDocumentUploaded = (newDocument) => {
  documents.value.unshift(newDocument);
};

const handleDocumentDeleted = (deletedDocumentId) => {
  documents.value = documents.value.filter(doc => doc.id !== deletedDocumentId);
  if (contextState.value.documentId === deletedDocumentId) {
    contextState.value = { view: 'idle', data: null, isLoading: false, error: null };
  }
};

const handleSummarizeRequest = async (documentId) => {
  isRightPanelOpen.value = true;
  contextState.value = { view: 'summary', data: null, isLoading: true, error: null, documentId };
  try {
    const response = await apiService.summarizeDocument(documentId);
    contextState.value.data = response.data.summary;
  } catch (error) {
    contextState.value.error = "Không thể tạo bản tóm tắt cho tài liệu này.";
    console.log("Lỗi tạo tóm tắt:", error);
  } finally {
    contextState.value.isLoading = false;
  }
};

const handleQuizRequest = async (documentId) => {
  isRightPanelOpen.value = true;
  contextState.value = { view: 'quiz', data: null, isLoading: true, error: null, documentId };
  try {
    const response = await apiService.generateQuiz({ documentIds: [documentId] });
    contextState.value.data = response.data;
  } catch (error) {
    contextState.value.error = "Không thể tạo câu hỏi trắc nghiệm từ tài liệu này.";
    console.log("Lỗi tạo quiz:", error);
  } finally {
    contextState.value.isLoading = false;
  }
};

const handleDocumentUpdate = (updatedDocument) => {
  const index = documents.value.findIndex(d => d.id === updatedDocument.id);
  if (index !== -1) {
    documents.value[index] = updatedDocument;
  }
};

const handleLogout = () => {
  isUserMenuOpen.value = false;
  authStore.logout();
  router.push('/');
}

// --- Vòng đời & Hooks ---

// Sử dụng `onMounted` để tải dữ liệu khi component được tạo lần đầu
onMounted(() => {
  fetchData(route.params.id);
  window.addEventListener('click', () => isUserMenuOpen.value = false);
});

onUnmounted(() => {
  window.removeEventListener('click', () => isUserMenuOpen.value = false);
});

// Sử dụng `onBeforeRouteUpdate` để tải lại dữ liệu khi chuyển giữa các dự án
onBeforeRouteUpdate(async (to, from) => {
  // Chỉ thực hiện khi `id` của dự án thay đổi
  if (to.params.id !== from.params.id) {
    // Đặt lại các trạng thái liên quan trước khi tải dữ liệu mới
    contextState.value = { view: 'idle', data: null, isLoading: false, error: null };
    await fetchData(to.params.id);
  }
});
</script>

<template>
  <div class="page-container">
    <!-- Header -->
    <header class="main-header">
      <div class="container-fluid d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <!-- CẬP NHẬT: Nút mở panel trái trên mobile -->
          <button class="btn btn-sm btn-outline-secondary d-lg-none" @click.stop="isLeftPanelOpen = true">
            <i class="bi bi-file-earmark-text"></i>
          </button>
          <router-link :to="{ name: 'dashboard' }"
            class="btn btn-sm btn-outline-secondary d-none d-lg-flex align-items-center gap-2">
            <i class="bi bi-arrow-left"></i>
            Back to Projects
          </router-link>
          <div class="vr d-none d-sm-block"></div>
          <h1 class="h6 mb-0 text-white fw-normal text-truncate d-none d-sm-block">
            {{ project?.name || 'Loading project...' }}</h1>
        </div>
        <div class="d-flex align-items-center gap-2" @click.stop>
          <!-- CẬP NHẬT: Nút mở panel phải trên mobile -->
          <button class="btn btn-sm btn-outline-secondary d-lg-none" @click.stop="isRightPanelOpen = true">
            <i class="bi bi-card-text"></i>
          </button>
          <div class="dropdown">
            <button @click="isUserMenuOpen = !isUserMenuOpen" class="btn btn-avatar p-0" type="button">
              <img src="https://placehold.co/100x100/81e6d9/1A202C?text=A" alt="User Avatar">
            </button>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" :class="{ show: isUserMenuOpen }">
              <li><button @click="handleLogout" class="dropdown-item text-danger"><i
                    class="bi bi-box-arrow-left me-2"></i>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Workspace Content -->
    <main class="content-wrapper">
      <div v-if="isLoading" class="d-flex justify-content-center align-items-center h-100">
        <div class="spinner-border text-primary-gradient" style="width: 3rem; height: 3rem;" role="status"></div>
      </div>
      <div v-else-if="errorMessage" class="d-flex justify-content-center align-items-center h-100">
        <div class="alert alert-danger">{{ errorMessage }}</div>
      </div>
      <div v-else class="workspace-grid">
        <!-- CẬP NHẬT: Backdrop cho mobile -->
        <div v-if="isLeftPanelOpen || isRightPanelOpen" class="mobile-backdrop d-lg-none"
          @click="isLeftPanelOpen = false; isRightPanelOpen = false"></div>

        <!-- Left Panel: Documents -->
        <div class="panel panel-left" :class="{ 'is-open': isLeftPanelOpen }">
          <!-- Thay thế bằng component DocumentList thật của bạn -->
          <div class="p-3">
            <h5 class="text-white">Documents</h5>
            <p class="text-secondary-light small">Manage your project's sources here.</p>
            <DocumentList :documents="documents" :project-id="project.id" @document-uploaded="handleDocumentUploaded"
              @document-deleted="handleDocumentDeleted" @request-summary="handleSummarizeRequest"
              @request-quiz="handleQuizRequest" @document-updated="handleDocumentUpdate" />
          </div>
        </div>

        <!-- Center Panel: Chat -->
        <div class="panel panel-center">
          <div class="chat-history">
            <ChatInterface :project-id="project.id" />
          </div>
        </div>

        <!-- Right Panel: Context -->
        <div class="panel panel-right" :class="{ 'is-open': isRightPanelOpen }">
          <!-- Thay thế bằng component ContextPanel thật của bạn -->
          <div class="p-3">
            <h5 class="text-white">Context</h5>
            <p class="text-secondary-light small">View summaries or quiz results.</p>
            <ContextPanel :state="contextState" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ===== General Layout ===== */
.page-container {
  font-family: 'Inter', sans-serif;
  background-color: #1A202C;
  color: #F7FAFC;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.text-secondary-light {
  color: #A0AEC0;
}

.text-primary-gradient {
  color: #4fd1c5;
}

/* ===== Header ===== */
.main-header {
  padding: 0.75rem 2rem;
  background-color: #1A202C;
  border-bottom: 1px solid #2D3748;
  flex-shrink: 0;
}

.btn-outline-secondary {
  color: #A0AEC0;
  border-color: #4A5568;
}

.btn-outline-secondary:hover {
  background-color: #4A5568;
  color: #F7FAFC;
}

.vr {
  background-color: #4A5568;
  opacity: 1;
}

/* ===== Avatar & Dropdown (Tái sử dụng) ===== */
.btn-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.btn-avatar:hover,
.btn-avatar:focus {
  border-color: #4fd1c5;
}

.btn-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.dropdown-menu {
  border-color: #4A5568;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.dropdown-item {
  display: flex;
  align-items: center;
}

/* ===== Workspace Layout ===== */
.content-wrapper {
  flex-grow: 1;
  overflow: hidden;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 300px 1fr 350px;
  height: 100%;
}

.panel {
  height: 100%;
  overflow-y: auto;
  background-color: #1A202C;
}

.panel-left {
  border-right: 1px solid #2D3748;
  overflow: hidden;
}

.panel-center {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
}

.chat-input-area {
  flex-shrink: 0;
  padding: 1rem;
  background-color: #161b25;
  border-top: 1px solid #2D3748;
}

.chat-input-area .form-control {
  background-color: #2D3748;
  border-color: #4A5568;
  color: #F7FAFC;
}

.chat-input-area .form-control:focus {
  background-color: #2D3748;
  border-color: #4fd1c5;
  box-shadow: 0 0 0 0.25rem rgba(79, 209, 197, 0.25);
}

.panel-right {
  border-left: 1px solid #2D3748;
  background-color: #161b25;
  overflow: hidden;
}

@media (max-width: 991.98px) {
  .workspace-grid {
    grid-template-columns: 1fr;
    /* Chỉ panel trung tâm chiếm không gian */
  }

  .panel-left,
  .panel-right {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 300px;
    max-width: 80%;
    z-index: 2000;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
    border: none;
  }

  .panel-right {
    left: auto;
    right: 0;
    transform: translateX(100%);
  }

  .panel-left.is-open,
  .panel-right.is-open {
    transform: translateX(0);
  }

  .mobile-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1999;
    animation: fadeIn 0.3s;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  .main-header {
    padding: 0.75rem 1rem;
  }
}
</style>
