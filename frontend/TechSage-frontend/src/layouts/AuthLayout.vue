<template>
  <!-- 
    AuthLayout: Bố cục tối giản cho các trang không yêu cầu xác thực.
    Nhiệm vụ chính là tạo một nền tối và căn giữa nội dung.
  -->
  <div class="auth-layout d-flex align-items-center justify-content-center min-vh-100">
    <main class="container">
      <!-- 
        Hiệu ứng chuyển đổi cho các route bên trong layout này.
        Khi người dùng chuyển từ Login sang Register, sẽ có hiệu ứng fade.
      -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  background-color: #1A202C;
  /* Màu nền chính - Dark Charcoal */
  background-image: radial-gradient(circle at 1% 1%, rgba(79, 209, 197, 0.15) 0px, transparent 40%),
    radial-gradient(circle at 99% 99%, rgba(129, 230, 217, 0.15) 0px, transparent 40%);
}

/* Hiệu ứng fade cho transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
