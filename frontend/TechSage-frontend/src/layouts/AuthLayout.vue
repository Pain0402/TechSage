<template>
  <!-- Tải font chữ Inter -->
  <Teleport to="head">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </Teleport>

  <div class="auth-layout-wrapper d-flex align-items-center justify-content-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
          <!-- Logo -->
          <div class="text-center mb-4 fade-in">
            <router-link :to="{ name: 'home' }">
              <img src="@/assets/techsage_logo.png" alt="TechSage Logo" class="logo-imgs mb-3" />
            </router-link>
          </div>

          <!-- Auth Card: Nội dung của Login/Register sẽ được chèn vào đây -->
          <div class="auth-card fade-in-delay">
            <slot>
              <!-- <LoginView v-if="authModalMode === 'login'" />
              <RegisterView v-else-if="authModalMode === 'register'" /> -->
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout-wrapper {
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background-color: #1A202C;
  /* Dark Charcoal */
  /* Cập nhật: Thêm họa tiết SVG tinh tế và giữ lại gradient */
  background-image:
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D3748' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(at 15% 20%, hsla(175, 70%, 50%, 0.1) 0px, transparent 50%),
    radial-gradient(at 85% 80%, hsla(195, 70%, 55%, 0.08) 0px, transparent 50%);
  color: #F7FAFC;
  /* Off-White */
}

.logo-img {
  width: 60px;
  height: 60px;
  transition: transform 0.3s ease;
}

.logo-img:hover {
  transform: scale(1.1);
}

.auth-card {
  position: relative;
  /* Cần thiết cho pseudo-element */
  background-color: #2D3748;
  /* Slate Gray */
  padding: 2.5rem;
  /* Tăng padding một chút */
  border-radius: 1rem;
  border: 1px solid #4A5568;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  /* Giữ cho các góc của border được bo tròn */
}

/* Cập nhật: Thêm viền gradient ở trên cùng với hiệu ứng */
.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  /* Chiều cao của viền gradient */
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  /* Animation cho viền trượt vào */
  animation: slideInBorder 1s ease-out 0.5s forwards;
  transform: translateX(-101%);
  /* Bắt đầu ngoài màn hình */
}

/* Animations */
.fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.fade-in-delay {
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.2s forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInBorder {
  to {
    transform: translateX(0);
  }
}
</style>
