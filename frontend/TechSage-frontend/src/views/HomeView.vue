<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import AuthModal from '@/components/AuthModal.vue';
import { useRouter } from 'vue-router';
import { useToasts } from '@/composables/useToasts';

const router = useRouter();
const { addToast } = useToasts();
const heroSection = ref(null);
const featuresSection = ref(null);

// eslint-disable-next-line no-unused-vars
const authStore = useAuthStore();
const isAuthModalVisible = ref(false);
const authModalMode = ref('login'); // 'login' or 'register'

const showAuthModal = (mode) => {
  authModalMode.value = mode;
  isAuthModalVisible.value = true;
};

const closeAuthModal = () => {
  isAuthModalVisible.value = false;
};

const onAuthSuccess = () => {
  closeAuthModal();
  // Check if the recent action was 'login' or 'register'
  if (authModalMode.value === 'login') {
    // If it's login, navigate to the dashboard
    addToast('Login successful!', 'success');
    router.push('/app/dashboard');
  } else {
    // If it's register, just show a notification and stay on the homepage
    addToast('Registration successful! Please log in to continue.', 'success');
    // No need for router.push() because we want to stay on the homepage
  }
};


// Animation khi cuộn trang
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  if (heroSection.value) observer.observe(heroSection.value);
  if (featuresSection.value) observer.observe(featuresSection.value);
});
</script>

<template>
  <!-- Tải font chữ Inter -->
  <Teleport to="head">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  </Teleport>

  <div class="techsage-landing-page">
    <!-- ===== Header ===== -->
    <header class="navbar navbar-expand-lg navbar-dark fixed-top">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="#">
          <!-- Thay thế bằng logo của bạn -->
          <img src="@/assets/techsage_logo.png" alt="TechSage Logo" class="logo-img me-2" />
          <span class="fw-bold">TechSage</span>
        </a>
        <div class="d-flex">
          <button @click="showAuthModal('login')" class="btn btn-outline-light me-2">Login</button>
          <button @click="showAuthModal('register')" class="btn btn-gradient">Get Started</button>
        </div>
      </div>
    </header>

    <!-- ===== Main Content ===== -->
    <main>
      <!-- Hero Section -->
      <section ref="heroSection" class="hero-section text-center d-flex align-items-center">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-8">
              <h1 class="display-4 fw-bolder text-white mb-3">
                Unlock Knowledge from Your Documents
              </h1>
              <p class="lead text-secondary-light mb-4">
                TechSage is your AI assistant that lets you chat with your PDFs and text files. Ask questions, get
                summaries, and create quizzes instantly.
              </p>
              <button @click="showAuthModal('register')" class="btn btn-gradient btn-lg">
                Start Your Free Project
                <i class="bi bi-arrow-right-short"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section ref="featuresSection" class="features-section py-5">
        <div class="container">
          <div class="row text-center mb-5">
            <div class="col-lg-8 mx-auto">
              <h2 class="fw-bold text-white">A Smarter Way to Research and Learn</h2>
              <p class="text-secondary-light">
                Leverage the power of Retrieval-Augmented Generation (RAG) for accurate, context-aware answers.
              </p>
            </div>
          </div>
          <div class="row g-4">
            <!-- Feature 1: Chat -->
            <div class="col-md-4">
              <div class="feature-card h-100">
                <div class="feature-icon mb-3">
                  <i class="bi bi-chat-dots-fill"></i>
                </div>
                <h5 class="fw-semibold text-white">Interactive Q&A</h5>
                <p class="text-secondary-light small">
                  Ask complex questions in natural language and get precise answers directly from your uploaded
                  documents.
                </p>
              </div>
            </div>
            <!-- Feature 2: Summarize -->
            <div class="col-md-4">
              <div class="feature-card h-100">
                <div class="feature-icon mb-3">
                  <i class="bi bi-file-text-fill"></i>
                </div>
                <h5 class="fw-semibold text-white">Instant Summaries</h5>
                <p class="text-secondary-light small">
                  Generate concise summaries of long documents with a single click, saving you hours of reading.
                </p>
              </div>
            </div>
            <!-- Feature 3: Quiz Generation -->
            <div class="col-md-4">
              <div class="feature-card h-100">
                <div class="feature-icon mb-3">
                  <i class="bi bi-patch-question-fill"></i>
                </div>
                <h5 class="fw-semibold text-white">Automated Quizzes</h5>
                <p class="text-secondary-light small">
                  Create multiple-choice quizzes from your study materials to test your knowledge and reinforce
                  learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ===== Footer ===== -->
    <footer class="py-4 text-center">
      <div class="container">
        <p class="text-secondary-light small mb-0">
          &copy; {{ new Date().getFullYear() }} TechSage. All Rights Reserved.
        </p>
      </div>
    </footer>
  </div>

  <!-- Auth Modal -->
  <Teleport to="body">
    <AuthModal v-if="isAuthModalVisible" :initial-mode="authModalMode" @close="closeAuthModal"
      @authSuccess="onAuthSuccess" />
  </Teleport>
</template>

<style scoped>
/* ===== General Styling & Dark Theme ===== */
.techsage-landing-page {
  font-family: 'Inter', sans-serif;
  background-color: #1A202C;
  /* Dark Charcoal */
  color: #F7FAFC;
  /* Off-White */
  overflow-x: hidden;
}

.text-secondary-light {
  color: #A0AEC0;
  /* Light Slate */
}

/* ===== Navbar ===== */
.navbar {
  background: rgba(26, 32, 44, 0.8);
  /* Dark Charcoal with transparency */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid #2D3748;
  /* Slate Gray border */
}

.logo-img {
  height: 32px;
  width: 32px;
  object-fit: contain;
}

.navbar-brand span {
  font-size: 1.25rem;
}

/* ===== Gradient Button ===== */
.btn-gradient {
  background-image: linear-gradient(to right, #4fd1c5, #81e6d9);
  border: none;
  color: #1A202C;
  /* Dark text on light gradient */
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(129, 230, 217, 0.1);
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(129, 230, 217, 0.2);
  color: #1A202C;
}

.btn-outline-light {
  transition: all 0.3s ease;
}

.btn-outline-light:hover {
  background-color: #F7FAFC;
  color: #1A202C;
}


/* ===== Hero Section ===== */
.hero-section {
  min-height: 100vh;
  padding-top: 100px;
  /* Offset for fixed navbar */
  background-image:
    radial-gradient(at 15% 20%, hsla(175, 70%, 50%, 0.15) 0px, transparent 50%),
    radial-gradient(at 85% 80%, hsla(195, 70%, 55%, 0.1) 0px, transparent 50%);
}

/* ===== Features Section ===== */
.features-section {
  background-color: #161b25;
  /* Slightly different dark shade for contrast */
  border-top: 1px solid #2D3748;
  border-bottom: 1px solid #2D3748;
}

.feature-card {
  background-color: #2D3748;
  /* Slate Gray */
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  transform: translateY(0);
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: #4fd1c5;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 2.5rem;
  background: -webkit-linear-gradient(#4fd1c5, #81e6d9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ===== Animations ===== */
.hero-section,
.features-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.fade-in-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ===== Footer ===== */
footer {
  background-color: #161b25;
}
</style>
