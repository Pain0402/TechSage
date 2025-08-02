<script setup>
import TheSidebar from '@/components/layout/TheSidebar.vue';
import TheHeader from '@/components/layout/TheHeader.vue'; // Import header mới
import ToastContainer from '@/components/base/ToastContainer.vue';
</script>

<template>
  <div class="app-layout">
    <TheSidebar />

    <div class="main-content d-flex flex-column">
      <!-- *** CẬP NHẬT: Thêm Header cho mobile *** -->
      <TheHeader />

      <main class="content-area flex-grow-1 p-3 p-md-4 p-lg-5">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <ToastContainer />
  </div>
</template>

<style scoped>
/* *** CẬP NHẬT: Style cho bố cục responsive *** */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #1A202C;
  /* Màu nền chính */
}

.main-content {
  flex-grow: 1;
  width: 100%;
}

@media (min-width: 992px) {
  .main-content {
    /* Tính toán chiều rộng còn lại sau khi trừ đi sidebar */
    width: calc(100% - 280px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
