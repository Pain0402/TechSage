<script setup>
import { computed } from 'vue';

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['request-delete']);

const formattedDate = computed(() => {
  return new Date(props.project.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
});

const handleDeleteClick = (event) => {
  event.preventDefault();
  emit('request-delete', props.project);
};
</script>

<template>
  <div class="project-list-item">
    <router-link :to="{ name: 'project-workspace', params: { id: project.id } }" class="item-main-link">
      <div class="item-content">
        <div class="item-icon">
          <i class="bi bi-journal-richtext"></i>
        </div>
        <div class="item-details">
          <h6 class="item-title text-white mb-0">{{ project.name }}</h6>
          <p class="item-description small text-secondary-light mb-0">{{ project.description ||
            'No description provided.' }}</p>
        </div>
      </div>
    </router-link>
    <div class="item-metadata">
      <span>0 Documents</span>
    </div>
    <div class="item-metadata">
      <span>{{ formattedDate }}</span>
    </div>
    <div class="item-actions">
      <button @click="handleDeleteClick" class="btn btn-sm btn-ghost" title="Delete project">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.project-list-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #2D3748;
  border: 1px solid #4A5568;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  gap: 1rem;
}

.project-list-item:hover {
  background-color: #4A5568;
  border-color: #4fd1c5;
  transform: translateY(-2px);
}

.item-main-link {
  flex-grow: 1;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-icon {
  font-size: 1.5rem;
  color: #4fd1c5;
}

.item-details {
  overflow: hidden;
}

.item-title,
.item-description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-metadata {
  flex-shrink: 0;
  width: 120px;
  font-size: 0.875rem;
  color: #A0AEC0;
  text-align: right;
}

.item-actions {
  flex-shrink: 0;
}

.btn-ghost {
  color: #A0AEC0;
}

.btn-ghost:hover {
  color: #F56565;
  background-color: rgba(245, 101, 101, 0.1);
}
</style>
