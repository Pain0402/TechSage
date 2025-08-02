<script setup>
import { onMounted, ref, computed } from 'vue';
import apiService from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

// --- State Management ---
const router = useRouter();
const authStore = useAuthStore();

const projects = ref([]);
const activeView = ref('grid'); // 'grid' or 'list'
const isLoading = ref(true);
const searchQuery = ref('');

// State cho modal tạo dự án
const isCreateModalVisible = ref(false);
const newProject = ref({
  name: '',
  description: ''
});

// State cho modal xác nhận xóa
const isDeleteModalVisible = ref(false);
const projectToDelete = ref(null);


// --- Computed Properties ---
// Lọc danh sách dự án dựa trên searchQuery
const filteredProjects = computed(() => {
  if (!searchQuery.value) {
    return projects.value;
  }
  return projects.value.filter(project =>
    project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});


// --- API Functions ---
const fetchProjects = async () => {
  isLoading.value = true;
  try {
    // Giả lập thời gian tải để thấy skeleton loader
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = await apiService.getProjects();
    // Sắp xếp dự án theo ngày cập nhật mới nhất
    projects.value = response.data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } catch (error) {
    console.error("Không thể tải danh sách dự án:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleCreateProject = async () => {
  if (!newProject.value.name) return;
  try {
    const response = await apiService.createProject(newProject.value);
    closeCreateModal();
    router.push(`/project/${response.data.id}`);
  } catch (error) {
    console.error('Tạo dự án thất bại!', error);
    alert('Tạo dự án thất bại! ' + (error.response?.data?.message || ''));
  }
};

const confirmDeleteProject = async () => {
  if (!projectToDelete.value) return;
  try {
    await apiService.deleteProject(projectToDelete.value.id);
    await fetchProjects(); // Tải lại danh sách dự án
  } catch (error) {
    console.error("Error deleting project:", error);
    alert('Xóa dự án thất bại! ' + (error.response?.data?.message || ''));
  } finally {
    closeDeleteModal();
  }
};

// --- Modal Controls ---
const showCreateModal = () => {
  isCreateModalVisible.value = true;
};
const closeCreateModal = () => {
  isCreateModalVisible.value = false;
  newProject.value = { name: '', description: '' }; // Reset form
};

const showDeleteModal = (project) => {
  projectToDelete.value = project;
  isDeleteModalVisible.value = true;
};
const closeDeleteModal = () => {
  isDeleteModalVisible.value = false;
  projectToDelete.value = null;
};


// --- Lifecycle Hooks ---
onMounted(() => {
  fetchProjects();

  const introduceDiv = document.querySelector('.introduce');
  if (introduceDiv) {
    setTimeout(() => {
      introduceDiv.classList.add('fade-in');
    }, 100);
  }
});

// --- Watchers ---
watch(() => authStore.isLoggedIn, (isNowLoggedIn, wasPreviouslyLoggedIn) => {
  // Nếu người dùng vừa chuyển từ trạng thái 'chưa đăng nhập' sang 'đã đăng nhập'
  if (isNowLoggedIn && !wasPreviouslyLoggedIn) {
    console.log('User has logged in. Fetching projects...');
    fetchProjects(); // Gọi lại hàm tải danh sách dự án
  }
});

// --- Utility Functions ---
const navigateToProject = (projectId) => {
  router.push(`/project/${projectId}`);
};

const setView = (view) => {
  activeView.value = view;
};

// Hàm định dạng thời gian tương đối
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return "vài giây trước";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

</script>

<template>
  <div v-if="authStore.isLoggedIn">
    <section class="introduce">
      <h2>Không gian làm việc của bạn</h2>
      <p>Quản lý, theo dõi và phát triển các dự án công nghệ của bạn một cách hiệu quả.</p>
    </section>

    <div class="options-bar">
      <button class="tool-button primary" @click="showCreateModal">
        <i class="bi bi-plus-lg"></i>
        <span>Tạo dự án</span>
      </button>
      <div class="search-wrapper">
        <i class="bi bi-search"></i>
        <input type="text" v-model="searchQuery" class="search-input" placeholder="Tìm kiếm dự án...">
      </div>
      <div class="view-toggles">
        <button :class="['view-toggle-btn', { 'active': activeView === 'grid' }]" @click="setView('grid')"
          title="Chế độ lưới">
          <i class="bi bi-grid-3x3-gap-fill"></i>
        </button>
        <button :class="['view-toggle-btn', { 'active': activeView === 'list' }]" @click="setView('list')"
          title="Chế độ danh sách">
          <i class="bi bi-list-ul"></i>
        </button>
      </div>
    </div>

    <!-- Trạng thái tải -->
    <section v-if="isLoading" :class="['project-container', activeView]">
      <div class="project-card-skeleton" v-for="n in 6" :key="n">
        <div class="skeleton-content">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line desc"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton-line date"></div>
        </div>
      </div>
    </section>

    <!-- Trạng thái có dữ liệu -->
    <section v-else-if="filteredProjects.length" :class="['project-container', activeView]">
      <div class="project-card" v-for="project in filteredProjects" :key="project.id">
        <div class="card-content" @click="navigateToProject(project.id)">
          <h3 class="card-title">{{ project.name }}</h3>
          <p class="card-description">{{ project.description || "Không có mô tả." }}</p>
        </div>
        <div class="card-footer">
          <span class="card-date">Cập nhật: {{ formatRelativeTime(project.updated_at) }}</span>
          <button class="card-menu-btn" @click.stop="showDeleteModal(project)" title="Xóa dự án">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- Trạng thái trống -->
    <section v-else class="empty-state">
      <div class="empty-state-content">
        <i class="bi bi-folder2-open"></i>
        <h3>{{ searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có dự án nào' }}</h3>
        <p>{{ searchQuery ? 'Hãy thử lại với từ khóa khác.' : 'Hãy bắt đầu bằng cách tạo dự án đầu tiên của bạn.' }}</p>
        <button v-if="!searchQuery" class="tool-button primary" @click="showCreateModal">
          <i class="bi bi-plus-lg"></i>
          <span>Tạo dự án mới</span>
        </button>
      </div>
    </section>

  </div>

  <!-- Thông báo khi chưa đăng nhập -->
  <div v-else class="logged-out-message">
    <section class="introduce">
      <h2>Chào mừng đến với TechSage!</h2>
      <p>Vui lòng <router-link to="/login">đăng nhập</router-link> để bắt đầu quản lý các dự án của bạn.</p>
    </section>
  </div>


  <!-- Modal Tạo Dự Án Mới -->
  <Teleport to="body">
    <div v-if="isCreateModalVisible" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Tạo dự án mới</h3>
          <button @click="closeCreateModal" class="close-btn"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="projectName">Tên dự án</label>
            <input id="projectName" v-model="newProject.name" type="text" placeholder="Ví dụ: Hệ thống quản lý AI">
          </div>
          <div class="form-group">
            <label for="projectDescription">Mô tả</label>
            <textarea id="projectDescription" v-model="newProject.description" rows="4"
              placeholder="Mô tả ngắn về mục tiêu của dự án..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" @click="closeCreateModal">Hủy</button>
          <button class="modal-button primary" @click="handleCreateProject">Tạo dự án</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal Xác Nhận Xóa -->
  <Teleport to="body">
    <div v-if="isDeleteModalVisible" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Xác nhận xóa</h3>
          <button @click="closeDeleteModal" class="close-btn"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p>Bạn có chắc chắn muốn xóa dự án <strong>"{{ projectToDelete?.name }}"</strong> không? Hành động này không
            thể hoàn tác.</p>
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" @click="closeDeleteModal">Hủy</button>
          <button class="modal-button danger" @click="confirmDeleteProject">Xóa dự án</button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<style>
/* Import Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");

/* Bảng màu và biến số nhất quán */
:root {
  --c-primary: #34d399;
  /* Emerald */
  --c-primary-hover: #2bb989;
  --c-danger: #ef4444;
  /* Red for delete */
  --c-danger-hover: #dc2626;
  --c-text-primary: #1f2937;
  --c-text-secondary: #4b5563;
  --c-bg-page: #f4f7f6;
  --c-bg-card: #ffffff;
  --c-bg-skeleton: #e5e7eb;
  --c-border: rgba(31, 41, 55, 0.1);
  --radius-md: 12px;
  --radius-sm: 8px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Phần giới thiệu */
.introduce {
  text-align: center;
  padding: 1rem 1rem 3rem 1rem;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.introduce.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.introduce h2 {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: 0.5rem;
}

.introduce p {
  font-size: 1.1rem;
  color: var(--c-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

/* Thanh công cụ */
.options-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
}

.search-wrapper {
  flex-grow: 1;
  position: relative;
}

.search-wrapper .bi-search {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-text-secondary);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background-color: var(--c-bg-card);
  color: var(--c-text-primary);
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2);
}

/* Các nút công cụ */
.tool-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-button.primary {
  background-color: var(--c-primary);
  color: white;
}

.tool-button.primary:hover {
  background-color: var(--c-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.view-toggles {
  display: flex;
  background-color: #e9ecef;
  border-radius: var(--radius-sm);
  padding: 4px;
}

.view-toggle-btn {
  background: transparent;
  border: none;
  color: var(--c-text-secondary);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-toggle-btn:hover {
  color: var(--c-text-primary);
}

.view-toggle-btn.active {
  background-color: var(--c-bg-card);
  color: var(--c-primary);
  box-shadow: var(--shadow-sm);
}

/* Container cho Lưới/Danh sách dự án */
.project-container {
  display: grid;
  gap: 1.5rem;
}

.project-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.project-container.list {
  grid-template-columns: 1fr;
  /* Một cột cho chế độ danh sách */
}

/* Kiểu thẻ dự án chung */
.project-card {
  background-color: var(--c-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.card-content {
  padding: 1.5rem;
  flex-grow: 1;
  cursor: pointer;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 1rem;
  color: var(--c-text-secondary);
  line-height: 1.5;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--c-text-secondary);
}

.card-menu-btn {
  background: none;
  border: none;
  color: var(--c-text-secondary);
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.card-menu-btn:hover {
  background-color: #f8f9fa;
  color: var(--c-danger);
}

/* Chế độ xem danh sách */
.project-container.list .project-card {
  flex-direction: row;
  align-items: center;
}

.project-container.list .card-content {
  padding: 1.25rem 1.5rem;
}

.project-container.list .card-footer {
  border-top: none;
  border-left: 1px solid var(--c-border);
  padding: 1.25rem 1.5rem;
  min-width: 200px;
  justify-content: flex-end;
  gap: 1rem;
}

.project-container.list .card-date {
  order: 1;
}

.project-container.list .card-menu-btn {
  order: 2;
}

/* Skeleton Loader */
.project-card-skeleton {
  background-color: var(--c-bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.project-container.list .project-card-skeleton {
  flex-direction: row;
  align-items: center;
}

.skeleton-content {
  flex-grow: 1;
}

.skeleton-line {
  background-color: var(--c-bg-skeleton);
  border-radius: 4px;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-line.title {
  height: 20px;
  width: 60%;
  margin-bottom: 1rem;
}

.skeleton-line.desc {
  height: 16px;
  width: 90%;
  margin-bottom: 0.5rem;
}

.skeleton-footer {
  margin-top: 1.5rem;
  border-top: 1px solid var(--c-border);
  padding-top: 1rem;
}

.skeleton-line.date {
  height: 14px;
  width: 40%;
}

.project-container.list .skeleton-footer {
  border-top: none;
  border-left: 1px solid var(--c-border);
  margin-top: 0;
  padding-top: 0;
  padding-left: 1.5rem;
}

@keyframes pulse {
  50% {
    opacity: .5;
  }
}

/* Trạng thái trống */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40vh;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-state .bi {
  font-size: 4rem;
  color: #bdc3c7;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--c-text-primary);
  font-weight: 600;
}

.empty-state p {
  color: var(--c-text-secondary);
  margin-bottom: 1rem;
}


/* Thông báo khi chưa đăng nhập */
.logged-out-message {
  height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logged-out-message a {
  color: var(--c-primary);
  font-weight: 500;
  text-decoration: none;
}

.logged-out-message a:hover {
  text-decoration: underline;
}

/* --- Kiểu cho Modal Tùy Chỉnh --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--c-text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--c-text-secondary);
  cursor: pointer;
}

.modal-body .form-group {
  margin-bottom: 1rem;
}

.modal-body label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--c-text-primary);
}

.modal-body input,
.modal-body textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: 1rem;
}

.modal-body input:focus,
.modal-body textarea:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}

.modal-button {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button.primary {
  background-color: var(--c-primary);
  color: white;
}

.modal-button.primary:hover {
  background-color: var(--c-primary-hover);
}

.modal-button.secondary {
  background-color: #e9ecef;
  color: var(--c-text-secondary);
}

.modal-button.secondary:hover {
  background-color: #dee2e6;
}

.modal-button.danger {
  background-color: var(--c-danger);
  color: white;
}

.modal-button.danger:hover {
  background-color: var(--c-danger-hover);
}
</style>
