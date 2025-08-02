<script setup>
import { ref, nextTick, watch } from 'vue';
import apiService from '@/services/api.service';
import { useToasts } from '@/composables/useToasts';
import { marked } from 'marked'; // Import marked để render markdown

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
});

const { addToast } = useToasts();
const messages = ref([
  { id: 1, author: 'ai', text: 'Xin chào! Tôi có thể giúp gì cho bạn với các tài liệu trong dự án này?' }
]);
const userInput = ref('');
const isLoading = ref(false);
const chatWindow = ref(null); // Ref để tham chiếu đến DOM của cửa sổ chat

const scrollToBottom = () => {
  nextTick(() => {
    if (chatWindow.value) {
      chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
    }
  });
};

const handleSendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const question = userInput.value;
  messages.value.push({
    id: Date.now(),
    author: 'user',
    text: question,
  });

  userInput.value = '';
  isLoading.value = true;
  scrollToBottom();

  try {
    const payload = { projectId: props.projectId, question: question };
    const response = await apiService.queryProject(payload);

    // Render câu trả lời từ markdown sang HTML
    const renderedAnswer = marked(response.data.answer);

    messages.value.push({
      id: Date.now() + 1,
      author: 'ai',
      text: renderedAnswer, // Lưu dạng HTML
      isHtml: true, // Đánh dấu là HTML
    });
  } catch (error) {
    const errorMessage = "Đã xảy ra lỗi khi gửi câu hỏi. Vui lòng thử lại." + error;
    messages.value.push({
      id: Date.now() + 1,
      author: 'ai',
      text: errorMessage,
      isError: true,
    });
    addToast(errorMessage, 'danger');
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// Tự động cuộn xuống khi có tin nhắn mới
watch(messages, scrollToBottom, { deep: true });
</script>

<template>
  <div class="chat-interface d-flex flex-column h-100">
    <div class="chat-window flex-grow-1 p-3 overflow-auto" ref="chatWindow">
      <div v-for="msg in messages" :key="msg.id"
        :class="['d-flex', 'mb-3', msg.author === 'user' ? 'justify-content-end' : 'justify-content-start']">
        <div :class="['message-bubble', `bubble-${msg.author}`, { 'bubble-error': msg.isError }]">
          <!-- Sử dụng v-html nếu tin nhắn là HTML, ngược lại hiển thị text bình thường -->
          <div v-if="msg.isHtml" v-html="msg.text" class="markdown-content"></div>
          <div v-else>{{ msg.text }}</div>
        </div>
      </div>
      <div v-if="isLoading" class="d-flex justify-content-start mb-3">
        <div class="message-bubble bubble-ai">
          <div class="spinner-grow spinner-grow-sm me-1" role="status"></div>
          <div class="spinner-grow spinner-grow-sm me-1" style="animation-delay: 0.2s" role="status"></div>
          <div class="spinner-grow spinner-grow-sm" style="animation-delay: 0.4s" role="status"></div>
        </div>
      </div>
    </div>

    <div class="chat-input-area p-3 border-top border-secondary-subtle">
      <form @submit.prevent="handleSendMessage">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Hỏi bất cứ điều gì về tài liệu của bạn..."
            v-model="userInput" :disabled="isLoading">
          <button class="btn btn-primary" type="submit" :disabled="isLoading || !userInput.trim()">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.chat-interface {
  background-color: #1A202C;
}

.message-bubble {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  line-height: 1.5;
  color: #F7FAFC;
}

.bubble-ai {
  background-color: #2D3748;
  border-top-left-radius: 0.25rem;
}

.bubble-user {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  color: #1A202C;
  font-weight: 500;
  border-top-right-radius: 0.25rem;
}

.bubble-error {
  background-color: rgba(245, 101, 101, 0.2);
  border: 1px solid #F56565;
}

.form-control {
  background-color: #2D3748;
  border-color: #4A5568;
  color: #F7FAFC;
}

.form-control:focus {
  background-color: #2D3748;
  border-color: #4fd1c5;
  box-shadow: none;
  color: #F7FAFC;
}

.btn-primary {
  background-image: none;
  background-color: #4fd1c5;
  border-color: #4fd1c5;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.2rem;
}

.markdown-content :deep(strong) {
  color: #81e6d9;
}
</style>
