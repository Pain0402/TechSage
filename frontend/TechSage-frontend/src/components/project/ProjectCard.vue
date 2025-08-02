<script setup>
import { computed } from 'vue';

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
});

// *** CẬP NHẬT: Thêm emit để yêu cầu xóa ***
const emit = defineEmits(['request-delete']);

const formattedDate = computed(() => {
  return new Date(props.project.updated_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

const handleDeleteClick = (event) => {
  // Ngăn sự kiện click lan ra thẻ <router-link> bên ngoài
  event.preventDefault();
  emit('request-delete', props.project);
};
</script>

<template>
  <router-link :to="{ name: 'project-workspace', params: { id: project.id } }" class="project-card-link">
    <div class="card h-100 project-card">
      <div class="card-body d-flex flex-column">
        <!-- *** CẬP NHẬT: Thêm nút xóa ở góc trên bên phải *** -->
        <button @click="handleDeleteClick" class="btn btn-sm btn-delete-card" title="Xóa dự án">
          <i class="bi bi-x-lg"></i>
        </button>

        <h5 class="card-title fw-bold text-white mb-2">{{ project.name }}</h5>
        <p class="card-text text-secondary flex-grow-1">{{ project.description || 'Không có mô tả.' }}</p>
        <div class="d-flex justify-content-between align-items-center mt-3 small text-secondary">
          <span><i class="bi bi-file-earmark-text-fill me-1"></i> 0 Documents</span>
          <span><i class="bi bi-arrow-repeat me-1"></i> {{ formattedDate }}</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.project-card {
  background-color: #2D3748;
  /* Slate Gray */
  border: 1px solid #4A5568;
  border-radius: 0.75rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  position: relative;
  /* Cần thiết cho việc định vị nút xóa */
}

.project-card-link {
  text-decoration: none;
}

.project-card:hover {
  transform: translateY(-5px);
  border-color: #4fd1c5;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.text-secondary {
  color: #A0AEC0 !important;
}

/* *** CẬP NHẬT: Style cho nút xóa *** */
.btn-delete-card {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #A0AEC0;
  background: none;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  line-height: 1;
  opacity: 0;
  /* Ẩn mặc định */
  transition: opacity 0.2s ease, background-color 0.2s ease;
  z-index: 10;
}

.project-card:hover .btn-delete-card {
  opacity: 1;
  /* Hiện khi hover vào card */
}

.btn-delete-card:hover {
  color: #F56565;
  background-color: rgba(245, 101, 101, 0.2);
}
</style>
