<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/api.service';
import ProjectCard from '@/components/project/ProjectCard.vue';
import ConfirmationModal from '@/components/base/ConfirmationModal.vue';
import ProjectModal from '@/components/project/ProjectModal.vue'; // Import modal mới
import { useAuthStore } from '@/stores/auth.store';
import { useToasts } from '@/composables/useToasts';

const projects = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);
const authStore = useAuthStore();
const { addToast } = useToasts();

const isDeleteModalVisible = ref(false);
const projectToDelete = ref(null);
const isProjectModalVisible = ref(false); // State cho modal tạo project

const fetchProjects = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const response = await apiService.getProjects();
    projects.value = response.data;
  } catch (error) {
    errorMessage.value = "Không thể tải danh sách dự án. Vui lòng thử lại.";
    console.log("Lỗi: " + error);

  } finally {
    isLoading.value = false;
  }
};

const openDeleteModal = (project) => {
  projectToDelete.value = project;
  isDeleteModalVisible.value = true;
};
const closeDeleteModal = () => {
  isDeleteModalVisible.value = false;
  projectToDelete.value = null;
};
const confirmDeleteProject = async () => {
  if (!projectToDelete.value) return;
  try {
    await apiService.deleteProject(projectToDelete.value.id);
    projects.value = projects.value.filter(p => p.id !== projectToDelete.value.id);
    addToast(`Đã xóa thành công dự án '${projectToDelete.value.name}'.`, 'success');
  } catch (error) {
    addToast('Xóa dự án thất bại.', 'danger');
    console.log("Lỗi: " + error);

  } finally {
    closeDeleteModal();
  }
};

// *** CẬP NHẬT: Hàm xử lý tạo project ***
const handleProjectCreated = (newProject) => {
  projects.value.unshift(newProject);
  addToast(`Đã tạo thành công dự án '${newProject.name}'.`, 'success');
};

onMounted(fetchProjects);
</script>

<template>
  <div class="dashboard-view">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h2 text-white fw-bold mb-0">Dashboard</h1>
        <p class="text-secondary mb-0">Chào mừng trở lại, {{ authStore.currentUser?.email }}</p>
      </div>
      <!-- *** CẬP NHẬT: Nút này sẽ mở modal tạo project *** -->
      <button @click="isProjectModalVisible = true" class="btn btn-primary fw-semibold d-flex align-items-center">
        <i class="bi bi-plus-circle-fill me-2"></i>
        New Project
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
    <div v-else-if="projects.length === 0" class="text-center py-5">
      <i class="bi bi-journal-x display-1 text-secondary"></i>
      <h3 class="mt-3 text-white">Chưa có dự án nào</h3>
      <p class="text-secondary">Hãy tạo dự án đầu tiên của bạn để bắt đầu.</p>
    </div>
    <div v-else class="row g-4">
      <div v-for="project in projects" :key="project.id" class="col-12 col-md-6 col-lg-4">
        <ProjectCard :project="project" @request-delete="openDeleteModal" />
      </div>
    </div>
  </div>

  <ConfirmationModal :show="isDeleteModalVisible" title="Xác nhận xóa dự án"
    :message="`Bạn có chắc chắn muốn xóa vĩnh viễn dự án '${projectToDelete?.name}' không?`" @close="closeDeleteModal"
    @confirm="confirmDeleteProject" />

  <!-- *** CẬP NHẬT: Thêm modal tạo project *** -->
  <ProjectModal :show="isProjectModalVisible" @close="isProjectModalVisible = false"
    @project-created="handleProjectCreated" />
</template>

<style scoped>
.btn-primary {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
}

.text-secondary {
  color: #A0AEC0 !important;
}

.spinner-border.text-primary {
  color: #4fd1c5 !important;
}
</style>
