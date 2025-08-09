<template>
  <div class="app-layout">
    <div class="main-content d-flex flex-column">
      <main class="content-area flex-grow-1 ">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>


  </div>
</template>

<style scoped>
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
