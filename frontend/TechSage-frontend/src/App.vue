<script setup>
import { RouterView } from 'vue-router'

</script>

<template>
  <RouterView />
</template>

<style>
/* Import Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");

/* Bảng màu và biến số nhất quán */
:root {
  --c-primary: #34d399;
  --c-primary-rgb: 52, 211, 153;
  --c-primary-hover: #2bb989;
  --c-text-primary: #1f2937;
  --c-text-secondary: #4b5563;
  --c-bg-page: #f4f7f6;
  --c-bg-component: #ffffff;
  --c-bg-component-alt: #f8f9fa;
  --c-border: rgba(31, 41, 55, 0.1);
  --c-user-bubble: #1f2937;
  --c-ai-bubble: #ffffff;
  --radius-md: 12px;
  --radius-sm: 8px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
