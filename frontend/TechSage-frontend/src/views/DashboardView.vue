<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import apiService from '@/services/api.service';
import ProjectCard from '@/components/project/ProjectCard.vue';
import ProjectListItem from '@/components/project/ProjectListItem.vue';
import ConfirmationModal from '@/components/base/ConfirmationModal.vue';
import ProjectModal from '@/components/project/ProjectModal.vue';
import { useToasts } from '@/composables/useToasts';

// --- State Management ---
const authStore = useAuthStore();
const { addToast } = useToasts();

const projects = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);
const isUserMenuOpen = ref(false);
// *** CẬP NHẬT: Đọc giá trị từ localStorage khi khởi tạo ***
const viewMode = ref(localStorage.getItem('dashboardViewMode') || 'grid');

// Modal states
const isDeleteModalVisible = ref(false);
const projectToDelete = ref(null);
const isProjectModalVisible = ref(false);

// --- Methods ---
const fetchProjects = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const response = await apiService.getProjects();
    projects.value = response.data;
  } catch (error) {
    errorMessage.value = "Could not load projects. Please try again.";
    addToast(errorMessage.value, 'danger');
    console.error("Failed to fetch projects:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  isUserMenuOpen.value = false;
  addToast('Logged out Successfully.', 'success');
  setTimeout(() => {
    authStore.logout();
  }, 700);
}

const openDeleteModal = (project) => {
  projectToDelete.value = project;
  isDeleteModalVisible.value = true;
};

const confirmDeleteProject = async () => {
  if (!projectToDelete.value) return;
  try {
    await apiService.deleteProject(projectToDelete.value.id);
    projects.value = projects.value.filter(p => p.id !== projectToDelete.value.id);
    addToast(`Successfully deleted project '${projectToDelete.value.name}'.`, 'success');
  } catch (error) {
    addToast('Failed to delete project.', 'danger');
    console.log("Error deleting project:", error);

  } finally {
    isDeleteModalVisible.value = false;
  }
};

const handleProjectCreated = (newProject) => {
  projects.value.unshift(newProject);
  addToast(`Successfully created project '${newProject.name}'.`, 'success');
  isProjectModalVisible.value = false;
};

const setViewMode = (mode) => {
  viewMode.value = mode;
  // *** CẬP NHẬT: Lưu lựa chọn vào localStorage ***
  localStorage.setItem('dashboardViewMode', mode);
};

// --- Lifecycle and Event Handling ---
onMounted(() => {
  fetchProjects();
  const closeDropdown = () => isUserMenuOpen.value = false;
  window.addEventListener('click', closeDropdown);
  onUnmounted(() => {
    window.removeEventListener('click', closeDropdown);
  });
});

</script>

<template>
  <div>
    <div class="page-container">
      <header class="main-header">
        <div class="container d-flex justify-content-between align-items-center">
          <a class="navbar-brand d-flex align-items-center" href="#">
            <img src="@/assets/techsage_logo.png" alt="TechSage Logo" class="logo-img me-2" />
            <span class="fw-bold fs-5">TechSage</span>
          </a>
          <div class="d-flex align-items-center gap-2" @click.stop>
            <button class="btn btn-outline-secondary btn-sm d-none d-md-inline-flex align-items-center gap-2">
              <i class="bi bi-gear-fill"></i> Settings
            </button>
            <div class="dropdown">
              <button @click="isUserMenuOpen = !isUserMenuOpen" class="btn btn-avatar p-0" type="button">
                <img src="https://placehold.co/100x100/81e6d9/1A202C?text=A" alt="User Avatar">
              </button>
              <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" :class="{ show: isUserMenuOpen }"
                style="right: 5px;">
                <li class="px-3 pt-2 pb-1">
                  <div class="fw-bold small">{{ authStore.user?.email }}</div>
                </li>
                <li>
                  <hr class="dropdown-divider">
                </li>
                <li><button @click="handleLogout" class="dropdown-item text-danger"><i
                      class="bi bi-box-arrow-left me-2"></i>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <main class="content-wrapper">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h2 class="h4 mb-0 text-white">Your Projects</h2>
            <div class="d-flex align-items-center gap-2">
              <div class="btn-group btn-group-sm" role="group">
                <button @click="setViewMode('grid')" type="button" class="btn btn-outline-secondary"
                  :class="{ active: viewMode === 'grid' }"><i class="bi bi-grid-3x3-gap-fill"></i></button>
                <button @click="setViewMode('list')" type="button" class="btn btn-outline-secondary"
                  :class="{ active: viewMode === 'list' }"><i class="bi bi-list-ul"></i></button>
              </div>
              <button @click="isProjectModalVisible = true" class="btn btn-gradient btn-sm"><i
                  class="bi bi-plus-lg me-1"></i> New Project</button>
            </div>
          </div>

          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary-gradient" role="status"><span
                class="visually-hidden">Loading...</span></div>
          </div>
          <div v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
          <div v-else-if="projects.length === 0" class="text-center py-5 empty-state">
            <i class="bi bi-journal-x display-1"></i>
            <h3 class="mt-3 text-white">No Projects Yet</h3>
            <p class="text-secondary-light">Create your first project to get started.</p>
          </div>

          <div v-else>
            <!-- Grid View -->
            <div v-if="viewMode === 'grid'" class="row g-4">
              <div v-for="project in projects" :key="project.id" class="col-12 col-sm-6 col-lg-4 col-xl-3">
                <ProjectCard :project="project" @request-delete="openDeleteModal(project)" />
              </div>
              <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div @click="isProjectModalVisible = true" class="project-card new-project-card">
                  <i class="bi bi-plus-lg"></i>
                  <span>New Project</span>
                </div>
              </div>
            </div>
            <!-- List View -->
            <div v-else-if="viewMode === 'list'" class="d-flex flex-column gap-3">
              <ProjectListItem v-for="project in projects" :key="project.id" :project="project"
                @request-delete="openDeleteModal(project)" />
            </div>
          </div>
        </div>
      </main>
    </div>

    <ConfirmationModal :show="isDeleteModalVisible" title="Confirm Project Deletion"
      :message="`Are you sure you want to permanently delete the project '${projectToDelete?.name}'?`"
      confirm-text="Delete Project" @close="isDeleteModalVisible = false" @confirm="confirmDeleteProject" />
    <ProjectModal :show="isProjectModalVisible" @close="isProjectModalVisible = false"
      @project-created="handleProjectCreated" />
  </div>
</template>

<style scoped>
.page-container {
  font-family: 'Inter', sans-serif;
  background-color: #1A202C;
  color: #F7FAFC;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image:
    radial-gradient(circle at top left, hsla(175, 70%, 50%, 0.1) 0px, transparent 40%),
    radial-gradient(circle at bottom right, hsla(195, 70%, 55%, 0.1) 0px, transparent 40%);
}

.text-secondary-light {
  color: #A0AEC0;
}

.logo-img {
  height: 32px;
  width: 32px;
  object-fit: contain;
}

.main-header {
  padding: 0.75rem 0;
  background: rgba(26, 32, 44, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #2D3748;
  position: sticky;
  top: 0;
  z-index: 1020;
}

.content-wrapper {
  flex-grow: 1;
  padding: 2rem 0;
}

.btn-gradient {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
  color: #1A202C;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(129, 230, 217, 0.2);
}

.btn-outline-secondary {
  color: #A0AEC0;
  border-color: #4A5568;
}

.btn-outline-secondary:hover,
.btn-outline-secondary.active {
  background-color: #4A5568;
  color: #F7FAFC;
  border-color: #4A5568;
}

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

.new-project-card {
  background-color: transparent;
  border: 2px dashed #4A5568;
  border-radius: 0.75rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #A0AEC0;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 150px;
}

.new-project-card:hover {
  color: #F7FAFC;
  background-color: #2D3748;
  border-color: #4fd1c5;
}

.new-project-card i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-state i {
  color: #4A5568;
}
</style>
