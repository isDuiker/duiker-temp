<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Header from "./Header.vue";
import Sidebar from "./Sidebar.vue";
import Breadcrumb from "./Breadcrumb.vue";

const COLLAPSE_KEY = "layout-collapsed";
const savedCollapsed = localStorage.getItem(COLLAPSE_KEY);

const collapsed = ref(
  savedCollapsed === null
    ? window.innerWidth < 960
    : savedCollapsed === "1"
);
const isNarrow = ref(window.innerWidth < 768);
// 窄屏下强制收起侧边栏，避免挤占内容区域
const menuCollapsed = computed(() => collapsed.value || isNarrow.value);

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

function handleResize() {
  isNarrow.value = window.innerWidth < 768;
}

function toggleCollapse() {
  if (isNarrow.value) return;
  collapsed.value = !collapsed.value;
  localStorage.setItem(COLLAPSE_KEY, collapsed.value ? "1" : "0");
}
</script>

<template>
  <div class="layout" :class="{ 'is-collapsed': menuCollapsed }">
    <Header :collapsed="menuCollapsed" @toggle="toggleCollapse" />
    <Sidebar :collapsed="menuCollapsed" />
    <div class="layout-main">
      <Breadcrumb />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  grid-template-rows: 50px minmax(0, 1fr);
  grid-template-areas:
    "header header"
    "sidebar main";
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color-page, #f8f8f8);
  transition: grid-template-columns 0.2s ease;
}

.layout.is-collapsed {
  grid-template-columns: 64px minmax(0, 1fr);
}

.layout-main {
  grid-area: main;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  background: var(--el-bg-color-page, #f8f8f8);
}

@media (max-width: 720px) {
  .layout-content {
    padding: 12px;
  }
}
</style>
