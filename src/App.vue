<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { THEME_KEY, useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();

// 初始化主题：优先使用上次保存的主题，否则跟随系统
themeStore.initTheme();

const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

function handleSystemThemeChange(event) {
  // 用户手动选择过主题后，不再跟随系统
  if (localStorage.getItem(THEME_KEY)) return;
  themeStore.applyTheme(event.matches ? "dark" : "light", false);
}

onMounted(() => {
  mediaQuery?.addEventListener?.("change", handleSystemThemeChange);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.("change", handleSystemThemeChange);
});
</script>

<template>
  <div class="app-container w-screen h-screen">
    <router-view />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  color: var(--app-text);
  background: var(--app-content-bg);
  transition: background-color 0.25s ease, color 0.25s ease;
}
</style>
