<script setup>
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const renderedHtml = computed(() => {
  if (!props.content) return '';
  // Cấu hình an toàn cho các liên kết
  marked.use({
    renderer: {
      link(href, title, text) {
        return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title}">${text}</a>`;
      }
    }
  });
  return marked.parse(props.content);
});
</script>

<template>
  <div v-html="renderedHtml" class="markdown-content"></div>
</template>

<style>
/* Thêm một chút style cho nội dung markdown cho đẹp */
.markdown-content ul,
.markdown-content ol {
  padding-left: 1.5rem;
}

.markdown-content code {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
}

.markdown-content pre {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}
</style>