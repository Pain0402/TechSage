<script setup>
// Libs
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

// --- Props ---
const props = defineProps({
  state: {
    type: Object,
    required: true,
    default: () => ({ view: 'idle', data: null, isLoading: false, error: null })
  }
});

// --- Quiz State ---
const selectedAnswers = ref({});
const isChecked = ref(false);

// --- Computed Properties ---
const renderedSummary = computed(() => {
  if (props.state.view === 'summary' && props.state.data) {
    return marked(props.state.data);
  }
  return '';
});

// --- Quiz Methods ---
const handleOptionSelect = (questionIndex, option) => {
  if (isChecked.value) return; // Don't allow changes after checking
  selectedAnswers.value[questionIndex] = option;
};

const checkAnswers = () => {
  isChecked.value = true;
};

const resetQuiz = () => {
  selectedAnswers.value = {};
  isChecked.value = false;
};

const getOptionClass = (question, option, questionIndex) => {
  if (!isChecked.value) {
    return {
      'active': selectedAnswers.value[questionIndex] === option
    };
  }

  const isCorrect = option === question.answer;
  const isSelected = selectedAnswers.value[questionIndex] === option;

  if (isCorrect) {
    return { 'is-correct': true };
  }
  if (isSelected && !isCorrect) {
    return { 'is-incorrect': true };
  }
  return {};
};

// --- Watchers ---
// Reset quiz state when quiz data changes (e.g., generating a new quiz)
watch(() => props.state.data, () => {
  if (props.state.view === 'quiz') {
    resetQuiz();
  }
});

</script>

<template>
  <div class="context-panel d-flex flex-column p-3 h-100">

    <div v-if="state.view === 'idle'"
      class="d-flex flex-column justify-content-center align-items-center text-center h-100">
      <i class="bi bi-lightbulb-fill display-4 text-secondary mb-3"></i>
      <h6 class="text-white">Context Panel</h6>
      <p class="small text-secondary px-3">
        Select an action from the document list (e.g., Summarize) to see the results here.
      </p>
    </div>

    <div v-else-if="state.view === 'summary'" class="d-flex flex-column h-100 overflow-auto">
      <h5 class="fw-bold text-white mb-3">Document Summary</h5>
      <div class="context-content flex-grow-1 overflow-auto p-3 rounded">
        <div v-if="state.isLoading" class="d-flex justify-content-center align-items-center h-100">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else-if="state.error" class="alert alert-danger">{{ state.error }}</div>
        <div v-else v-html="renderedSummary" class="markdown-content"></div>
      </div>
    </div>

    <div v-else-if="state.view === 'quiz'" class="d-flex flex-column h-100 overflow-auto">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold text-white mb-0">Multiple Choice Quiz</h5>
        <button v-if="isChecked" @click="resetQuiz" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-arrow-clockwise"></i> Try Again
        </button>
      </div>
      <div class="context-content flex-grow-1 overflow-auto p-3 rounded">
        <div v-if="state.isLoading" class="d-flex justify-content-center align-items-center h-100">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else-if="state.error" class="alert alert-danger">{{ state.error }}</div>
        <div v-else-if="state.data && state.data.length > 0">
          <div v-for="(question, index) in state.data" :key="index" class="mb-4 quiz-question">
            <p class="fw-bold text-white">{{ index + 1 }}. {{ question.question }}</p>
            <div class="list-group">
              <button v-for="(option, optIndex) in question.options" :key="optIndex" type="button"
                class="list-group-item list-group-item-action quiz-option"
                :class="getOptionClass(question, option, index)" @click="handleOptionSelect(index, option)"
                :disabled="isChecked">
                {{ option }}
              </button>
            </div>
          </div>
          <div v-if="!isChecked" class="d-grid mt-4">
            <button @click="checkAnswers" class="btn btn-primary">Check Answers</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.context-panel {
  background-color: #2D3748;
  border-radius: 15px;
  max-height: 570px;
  min-height: 570px;
  transition: transform 0.3s ease-in-out;
}

.text-secondary {
  color: #A0AEC0 !important;
}

.context-content {
  background-color: #1A202C;
  border: 1px solid #4A5568;
}

.spinner-border.text-primary {
  color: #4fd1c5 !important;
}

/* Markdown Content Styles */
.markdown-content {
  color: #F7FAFC;
  line-height: 1.7;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  color: #fff;
  border-bottom: 1px solid #4A5568;
  padding-bottom: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(code) {
  background-color: #1A202C;
  color: #81e6d9;
  padding: 0.2em 0.4em;
  border-radius: 6px;
}

.markdown-content :deep(pre) {
  background-color: #1A202C;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-content :deep(strong) {
  color: #81e6d9;
}

/* Quiz Styles */
.quiz-question {
  border-bottom: 1px solid #4A5568;
  padding-bottom: 1rem;
}

.quiz-question:last-child {
  border-bottom: none;
}

.quiz-option {
  background-color: #2D3748;
  border: 1px solid #4A5568;
  color: #F7FAFC;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  text-align: left;
}

.quiz-option.active {
  border-color: #4fd1c5;
  background-color: rgba(79, 209, 197, 0.1);
  color: #fff;
  font-weight: 500;
}

.quiz-option:disabled {
  cursor: not-allowed;
}

.quiz-option.is-correct {
  border-color: #48BB78;
  background-color: rgba(72, 187, 120, 0.2);
  color: #fff;
  font-weight: bold;
}

.quiz-option.is-incorrect {
  border-color: #F56565;
  background-color: rgba(245, 101, 101, 0.2);
  color: #A0AEC0;
  text-decoration: line-through;
}

.btn-primary {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
}
</style>