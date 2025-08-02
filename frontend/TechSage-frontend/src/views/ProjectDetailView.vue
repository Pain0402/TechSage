<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import apiService from '@/services/api.service';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { Modal } from 'bootstrap';
// --- State Management ---
const route = useRoute();
const projectId = route.params.id;

const project = ref([]);
const documents = ref([]);
const messages = ref([
  // Tin nhắn chào mừng ban đầu
  { id: 'initial', text: 'Xin chào! Tôi có thể giúp gì cho bạn với các tài liệu trong dự án này?', sender: 'ai' }
]);
const newMessage = ref('');

// Loading states
const isLoadingProject = ref(true);
const isLoadingDocuments = ref(true);
const isAiThinking = ref(false);
const isUploading = ref(false);

// Template refs
const fileInput = ref(null);
const chatContainer = ref(null);

// --- API Functions ---

const fetchDocuments = async () => {
  isLoadingDocuments.value = true;
  try {
    const response = await apiService.getDocuments(projectId);
    documents.value = response.data;
  } catch (error) {
    console.error("Lỗi tải tài liệu:", error);
  } finally {
    isLoadingDocuments.value = false;
  }
};

const fetchProjectDetails = async () => {
  isLoadingProject.value = true;
  try {
    const response = await apiService.getProject(projectId);
    project.value = response.data;
  } catch (error) {
    console.error("Lỗi tải dự án:", error);
  } finally {
    isLoadingProject.value = false;
  }
};

// === State cho chức năng Quiz ===
const quizState = ref('configuring'); // 'configuring', 'generating', 'answering', 'results'
const quizConfig = ref({
  documentIds: [],
  numQuestions: 5,
  difficulty: 'trung bình'
});
const quizData = ref([]);
const userAnswers = ref([]);
const score = ref(0);

// Hàm bắt đầu tạo quiz
const handleGenerateQuiz = async () => {
  quizState.value = 'generating';
  try {
    const response = await apiService.generateQuiz(projectId, quizConfig.value);
    quizData.value = response.data;
    userAnswers.value = new Array(quizData.value.length).fill(null);
    quizState.value = 'answering';
  } catch (error) {
    alert('Không thể tạo quiz. Vui lòng thử lại. ' + (error.response?.data?.message || ''));
    quizState.value = 'configuring';
  }
};

// Hàm khi người dùng chọn một đáp án
const selectAnswer = (questionIndex, option) => {
  userAnswers.value[questionIndex] = option;
};

// Hàm nộp bài và chấm điểm
const submitQuiz = () => {
  let currentScore = 0;
  quizData.value.forEach((q, index) => {
    if (q.answer === userAnswers.value[index]) {
      currentScore++;
    }
  });
  score.value = currentScore;
  quizState.value = 'results';
};

// Hàm để reset và làm lại từ đầu
const resetQuizState = () => {
  quizState.value = 'configuring';
  quizConfig.value.documentIds = [];
  quizData.value = [];
  userAnswers.value = [];
  score.value = 0;
};

// Hàm để hiển thị icon đúng/sai khi xem kết quả
const getIconForOption = (option, correctAnswer, userAnswer) => {
  if (option === correctAnswer) return 'bi bi-check-circle-fill';
  if (option === userAnswer && option !== correctAnswer) return 'bi bi-x-circle-fill';
  return 'bi bi-circle';
};

const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (text === '' || isAiThinking.value) return;

  messages.value.push({ id: Date.now(), text, sender: 'user' });
  scrollToBottom();
  newMessage.value = '';
  isAiThinking.value = true;

  try {
    const res = await apiService.queryProject(projectId, text);
    messages.value.push({ id: Date.now() + 1, text: res.data.answer, sender: 'ai' });
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại. ' + (error.response?.data?.message || ''),
      sender: 'ai',
      isError: true,
    });
  } finally {
    isAiThinking.value = false;
    scrollToBottom();
  }
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isUploading.value = true;
  const formData = new FormData();
  formData.append('documentFile', file);
  formData.append('projectId', projectId);

  try {
    const res = await apiService.uploadDocument(formData);
    documents.value.unshift(res.data.document);

    // Gọi fetchDocuments liên tục cho đến khi tất cả doc đều có status = 'ready'
    const pollUntilReady = async (maxRetries = 20, interval = 3000) => {
      for (let i = 0; i < maxRetries; i++) {
        await fetchDocuments();
        const allReady = documents.value.every(doc => doc.status === 'ready');
        if (allReady) break;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    };

    await pollUntilReady();
  } catch (error) {
    alert('Tải file thất bại! ' + (error.response?.data?.message || ''));
  } finally {
    isUploading.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};


const handleDeleteDocument = async (docId) => {
  if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;

  try {
    await apiService.deleteDocument(docId);
    documents.value = documents.value.filter(doc => doc.id !== docId);
  } catch (error) {
    alert('Xóa tài liệu thất bại! ' + (error.response?.data?.message || ''));
  }
};

const isSummarizing = ref(false);
const summaryContent = ref('');

const handleSummarize = async (doc) => {
  if (doc.status !== 'ready') {
    alert('Tài liệu đang được xử lý, chưa thể tóm tắt.');
    return;
  }

  // Hiển thị modal
  const modalElement = document.getElementById('summaryModal');
  const modalInstance = new Modal(modalElement);
  modalInstance.show();

  // Bắt đầu quá trình
  isSummarizing.value = true;
  summaryContent.value = '';

  try {
    const response = await apiService.summarizeDocument(doc.id);
    summaryContent.value = response.data.summary;
  } catch (error) {
    summaryContent.value = "### Đã xảy ra lỗi\n\nKhông thể tạo bản tóm tắt cho tài liệu này. Vui lòng thử lại sau.";
    console.error("Lỗi gọi API tóm tắt:", error);
  } finally {
    isSummarizing.value = false;
  }
};


// --- Lifecycle & Utility Functions ---
onMounted(() => {
  fetchDocuments();
  fetchProjectDetails();
});


const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTo({ top: chatContainer.value.scrollHeight, behavior: 'smooth' });
    }
  });
};

const triggerFileInput = () => {
  fileInput.value.click();
};


</script>

<template>
  <div class="project-detail-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="back-link">
          <i class="bi bi-arrow-left-circle-fill"></i>
        </router-link>
        <h3>Tài liệu dự án</h3>
        <button @click="triggerFileInput" class="upload-btn" :disabled="isUploading" title="Tải lên tài liệu mới">
          <i v-if="!isUploading" class="bi bi-plus-circle-fill"></i>
          <div v-else class="spinner-border spinner-border-sm" role="status"></div>
        </button>
        <input type="file" @change="handleFileUpload" ref="fileInput" hidden>
      </div>
      <div class="sidebar-content">
        <!-- Trạng thái tải tài liệu -->
        <div v-if="isLoadingDocuments" class="doc-list">
          <div v-for="n in 4" :key="n" class="doc-item-skeleton">
            <div class="skeleton-line icon"></div>
            <div class="skeleton-line text"></div>
          </div>
        </div>
        <!-- Trạng thái có tài liệu -->
        <ul v-else-if="documents.length" class="doc-list">
          <li v-for="doc in documents" :key="doc.id" class="doc-item">
            <i class="bi bi-file-earmark-text-fill"></i>
            <span class="doc-name">{{ doc.file_name }}</span>
            <button class="delete-doc-btn" @click="handleDeleteDocument(doc.id)">
              <i class="bi bi-trash3"></i>
            </button>
            <button @click="handleSummarize(doc)" class="btn btn-outline-secondary btn-sm"
              :disabled="doc.status !== 'ready'" title="Tóm tắt tài liệu này">
              <i class="bi bi-card-text"></i>
            </button>
          </li>
        </ul>
        <!-- Trạng thái trống -->
        <div v-else class="empty-docs">
          <i class="bi bi-folder2-open"></i>
          <p>Chưa có tài liệu nào được tải lên.</p>
        </div>
      </div>
    </aside>

    <!-- Summerize Modal -->
    <div class="modal fade" id="summaryModal" tabindex="-1" aria-labelledby="summaryModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="summaryModalLabel">Tóm tắt tài liệu</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="isSummarizing" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tóm tắt...</span>
              </div>
              <p class="mt-2">AI đang đọc và tóm tắt, vui lòng chờ...</p>
            </div>
            <MarkdownRenderer v-else :content="summaryContent" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz modal -->
    <div class="modal fade" id="quizModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Tạo Câu hỏi Trắc nghiệm</h5>
            <button type="button" class="btn-close" @click="resetQuizState" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">

            <div v-if="quizState === 'configuring'">
              <h6>1. Chọn tài liệu nguồn</h6>
              <div v-for="doc in documents" :key="doc.id" class="form-check">
                <input class="form-check-input" type="checkbox" :value="doc.id" v-model="quizConfig.documentIds"
                  style="width: 5px;">
                <label class="form-check-label">{{ doc.file_name }}</label>
              </div>
              <hr>
              <h6>2. Tùy chỉnh</h6>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Số lượng câu hỏi</label>
                  <input type="number" class="form-control" v-model.number="quizConfig.numQuestions" min="1" max="10">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Mức độ khó</label>
                  <select class="form-select" v-model="quizConfig.difficulty">
                    <option value="dễ">Dễ</option>
                    <option value="trung bình">Trung bình</option>
                    <option value="khó">Khó</option>
                  </select>
                </div>
              </div>
              <button @click="handleGenerateQuiz" class="btn btn-primary w-100"
                :disabled="quizConfig.documentIds.length === 0">Bắt đầu tạo</button>
            </div>

            <div v-if="quizState === 'generating'" class="text-center my-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2">AI đang phân tích tài liệu và tạo câu hỏi...</p>
            </div>

            <div v-if="quizState === 'answering'">
              <div v-for="(q, index) in quizData" :key="index" class="mb-4">
                <p><strong>Câu {{ index + 1 }}:</strong> {{ q.question }}</p>
                <div class="list-group">
                  <button v-for="option in q.options" :key="option" type="button" @click="selectAnswer(index, option)"
                    :class="['list-group-item list-group-item-action', { 'active': userAnswers[index] === option }]">
                    {{ option }}
                  </button>
                </div>
              </div>
              <button @click="submitQuiz" class="btn btn-success w-100 mt-3"
                :disabled="userAnswers.length < quizData.length">Nộp bài</button>
            </div>

            <div v-if="quizState === 'results'">
              <div class="alert alert-success text-center">
                <h4>Kết quả: Bạn đã trả lời đúng {{ score }} / {{ quizData.length }} câu!</h4>
              </div>
              <div v-for="(q, index) in quizData" :key="index" class="mb-4 p-3 border rounded">
                <p><strong>Câu {{ index + 1 }}:</strong> {{ q.question }}</p>
                <ul class="list-unstyled">
                  <li v-for="option in q.options" :key="option"
                    :class="{ 'text-success fw-bold': option === q.answer, 'text-danger': option === userAnswers[index] && option !== q.answer }">
                    <i :class="getIconForOption(option, q.answer, userAnswers[index])"></i> {{ option }}
                  </li>
                </ul>
              </div>
              <button @click="resetQuizState" class="btn btn-secondary w-100">Làm lại Quiz khác</button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <main class="chat-area">
      <header class="chat-header">
        <div v-if="isLoadingProject" class="skeleton-line title"></div>
        <h2 v-else>{{ project.name || 'Chi tiết dự án' }}
        </h2>



        <button class="btn btn-success create_quiz" data-bs-toggle="modal" data-bs-target="#quizModal">
          <i class="bi bi-patch-question-fill me-2"></i>Tạo Quiz
        </button>
      </header>

      <div ref="chatContainer" class="messages-container">
        <div v-for="message in messages" :key="message.id" class="message-wrapper" :class="`sender-${message.sender}`">
          <div class="message-bubble" :class="{ 'error-bubble': message.isError }">
            <MarkdownRenderer v-if="message.sender === 'ai'" :content="message.text" />
            <div v-else>{{ message.text }}</div>
          </div>
        </div>
        <!-- AI Thinking Indicator -->
        <div v-if="isAiThinking" class="message-wrapper sender-ai">
          <div class="message-bubble thinking-bubble">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="message-input-area">
        <div class="input-wrapper">
          <textarea v-model="newMessage" class="message-input" placeholder="Hỏi bất cứ điều gì về tài liệu của bạn..."
            :disabled="isAiThinking" @keyup.enter.exact="sendMessage"></textarea>
          <button class="send-btn" @click="sendMessage" :disabled="isAiThinking || !newMessage.trim()">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.project-detail-container {
  display: flex;
  height: 100vh;
  background-color: var(--c-bg-page);
}

/* --- Sidebar --- */
.sidebar {
  width: 320px;
  background-color: var(--c-bg-component-alt);
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0;
}

.upload-btn {
  background: none;
  border: none;
  color: var(--c-primary);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.upload-btn:hover {
  color: var(--c-primary-hover);
}

.upload-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.sidebar-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
}

.doc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease;
}

.doc-item:hover {
  background-color: #e9ecef;
}

.doc-item .bi-file-earmark-text-fill {
  color: var(--c-text-secondary);
  font-size: 1.25rem;
  margin-right: 0.75rem;
}

.doc-name {
  flex-grow: 1;
  color: var(--c-text-primary);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-doc-btn {
  background: none;
  border: none;
  color: var(--c-text-secondary);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.doc-item:hover .delete-doc-btn {
  opacity: 1;
}

.delete-doc-btn:hover {
  color: var(--c-danger, #ef4444);
}

.empty-docs {
  text-align: center;
  padding: 2rem;
  color: var(--c-text-secondary);
}

.empty-docs .bi {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ced4da;
}

/* --- Chat Area --- */

.create_quiz {
  background-color: var(--c-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.create_quiz:hover {
  background-color: var(--c-primary-hover);
}

.chat-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--c-bg-component);
}

.chat-header {
  padding: 1.52rem;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--c-text-secondary);
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--c-primary);
}

.back-link .bi {
  font-size: 1.25rem;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2rem;
}

.message-wrapper {
  display: flex;
  margin-bottom: 1.5rem;
  max-width: 75%;
}

.message-wrapper.sender-user {
  margin-left: auto;
  justify-content: flex-end;
}

.message-wrapper.sender-ai {
  justify-content: flex-start;
}

.message-bubble {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  line-height: 1.6;
}

.sender-user .message-bubble {
  background-color: var(--c-user-bubble);
  background-color: #1f2937;
  /* border: #1f2937 1px solid; */
  color: white;
  border-top-right-radius: 4px;
}

.sender-ai .message-bubble {
  background-color: var(--c-ai-bubble);
  color: var(--c-text-primary);
  border: 1px solid var(--c-border);
  border-top-left-radius: 4px;
}

.error-bubble {
  background-color: #fff5f5;
  border-color: #fecaca;
  color: #991b1b;
}

/* --- Message Input --- */
.message-input-area {
  padding: 1rem 2rem;
  border-top: 1px solid var(--c-border);
  background-color: var(--c-bg-component-alt);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.message-input {
  width: 100%;
  padding: 1rem 3.5rem 1rem 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background-color: var(--c-bg-component);
  color: var(--c-text-primary);
  font-size: 1rem;
  resize: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(var(--c-primary-rgb), 0.2);
}

.send-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--c-primary);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.send-btn:hover {
  background-color: var(--c-primary-hover);
}

.send-btn:disabled {
  background-color: #a5d8ff;
  cursor: not-allowed;
}

/* --- Skeleton & Loading States --- */
.skeleton-line {
  background-color: #e5e7eb;
  border-radius: 4px;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  50% {
    opacity: .5;
  }
}

.chat-header .skeleton-line.title {
  height: 28px;
  width: 40%;
}

.doc-item-skeleton {
  display: flex;
  align-items: center;
  padding: 0.75rem;
}

.doc-item-skeleton .icon {
  width: 20px;
  height: 20px;
  margin-right: 0.75rem;
}

.doc-item-skeleton .text {
  flex-grow: 1;
  height: 16px;
}

.thinking-bubble {
  display: flex;
  gap: 5px;
  align-items: center;
}

.thinking-bubble .dot {
  width: 8px;
  height: 8px;
  background-color: #bdc3c7;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1.0);
  }
}
</style>
