<template>
  <header class="app-header d-flex d-lg-none align-items-center p-3 border-bottom">
    <!-- Nút bật/tắt Sidebar cho mobile -->
    <button class="btn btn-outline-secondary me-3" type="button" data-bs-toggle="offcanvas"
      data-bs-target="#sidebarMenu" aria-controls="sidebarMenu">
      <i class="bi bi-list"></i>
    </button>

    <!-- Tên thương hiệu -->
    <router-link :to="{ name: 'dashboard' }" class="d-flex align-items-center text-white text-decoration-none">
      <img src="@/assets/techsage_logo.png" alt="TechSage Logo" width="30" height="30" class="me-2">
      <span class="fs-5 fw-bold">TechSage</span>
    </router-link>
  </header>
</template>

<style scoped>
.app-header {
  background-color: #2D3748;
  border-color: #4A5568 !important;
}
</style>
