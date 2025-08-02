<script setup>
import { useAuthStore } from '@/stores/auth.store';
// import { useRouter } from 'vue-router';

const authStore = useAuthStore();
// const router = useRouter();

const handleLogout = () => {
  authStore.logout();
};
</script>

<template>
  <!-- *** CẬP NHẬT: Thêm các class offcanvas của Bootstrap *** -->
  <aside class="sidebar offcanvas-lg offcanvas-start d-flex flex-column flex-shrink-0 p-3" tabindex="-1"
    id="sidebarMenu" aria-labelledby="sidebarMenuLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="sidebarMenuLabel">
        <router-link :to="{ name: 'dashboard' }" class="d-flex align-items-center text-white text-decoration-none">
          <img src="@/assets/techsage_logo.png" alt="TechSage Logo" width="32" height="32" class="me-2">
          <span class="fs-4 fw-bold">TechSage</span>
        </router-link>
      </h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu"
        aria-label="Close"></button>
    </div>

    <div class="offcanvas-body d-flex flex-column p-0">
      <hr class="d-none d-lg-block">
      <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item">
          <router-link :to="{ name: 'dashboard' }" class="nav-link" active-class="active">
            <i class="bi bi-grid-fill me-2"></i>
            Dashboard
          </router-link>
        </li>
        <!-- Các mục khác -->
      </ul>
      <hr>
      <div class="dropdown">
        <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
          data-bs-toggle="dropdown" aria-expanded="false">
          <img src="https://placehold.co/32x32/F7FAFC/2D3748?text=A" alt="" width="32" height="32"
            class="rounded-circle me-2">
          <strong>{{ authStore.currentUser?.email }}</strong>
        </a>
        <ul class="dropdown-menu dropdown-menu-dark text-small shadow">
          <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">Đăng xuất</a></li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background-color: #2D3748;
  color: #F7FAFC;
  border-right: 1px solid #4A5568;
}

.nav-link {
  color: #A0AEC0;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(79, 209, 197, 0.1);
  color: #F7FAFC;
}

.nav-link.active {
  color: #ffffff;
  font-weight: 500;
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
}

hr {
  border-color: rgba(255, 255, 255, 0.1);
}

.dropdown-menu {
  background-color: #2D3748;
  border: 1px solid #4A5568;
}

.dropdown-item:hover {
  background-color: rgba(79, 209, 197, 0.2);
}

.btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}
</style>
