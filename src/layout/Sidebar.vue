<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  Document,
  Grid,
  House,
  InfoFilled,
  Setting,
} from "@element-plus/icons-vue";
import { STATIC_ROUTES } from "@/router/routes";
import SidebarItem from "./SidebarItem.vue";

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();

// 菜单图标映射，按路由 name 配置，新增页面时在此补充即可
const MENU_ICONS = {
  home: House,
  system: Setting,
  feature: Grid,
  about: InfoFilled,
  test: Document,
};

const menuItems = computed(() => {
  const layoutRoute = STATIC_ROUTES.find((item) => item.name === "layout");
  if (!layoutRoute?.children) return [];
  return generateMenu(layoutRoute.children);
});

function generateMenu(routes, depth = 0) {
  const menu = [];

  routes.forEach((item) => {
    if (item.meta?.hidden) return;

    const children =
      item.children && item.children.length > 0
        ? generateMenu(item.children, depth + 1)
        : [];

    menu.push({
      path: item.path,
      title: item.meta?.title || item.name || "未命名",
      icon: depth === 0 ? MENU_ICONS[item.name] : undefined,
      children,
    });
  });

  return menu;
}
</script>

<template>
  <aside class="sidebar">
    <el-menu
      :default-active="route.path"
      class="sidebar-menu"
      :collapse="collapsed"
      :collapse-transition="false"
      menu-trigger="hover"
      unique-opened
      router
    >
      <SidebarItem v-for="item in menuItems" :key="item.path" :item="item" />
    </el-menu>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  grid-area: sidebar;
  min-height: 0;
  overflow: hidden;
  background: #e5ebfd;
  border-right: 1px solid #d8e1fa;
}

.sidebar-menu {
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #e5ebfd;
  border-right: 0;
  scrollbar-color: rgb(38 95 236 / 25%) transparent;
  scrollbar-width: thin;

  --el-menu-bg-color: #e5ebfd;
  --el-menu-text-color: #303133;
  --el-menu-active-color: #265fec;
  --el-menu-hover-text-color: #265fec;
  --el-menu-hover-bg-color: #d8e1fa;
  --el-menu-item-font-size: 15px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgb(38 95 236 / 25%);
    border-radius: 2px;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    display: flex;
    align-items: center;
    height: 48px;
    padding-left: 20px !important;
    line-height: 48px;
  }

  // 普通菜单图标（排除展开箭头，避免覆盖箭头尺寸和位置）
  :deep(.el-menu-item .el-icon:not(.el-sub-menu__icon-arrow)),
  :deep(.el-sub-menu__title .el-icon:not(.el-sub-menu__icon-arrow)) {
    width: 20px;
    margin-right: 10px;
    font-size: 18px;
    color: #63718a;
  }

  // 展开箭头靠右，并保持垂直居中
  :deep(.el-sub-menu__icon-arrow) {
    right: 14px;
    margin-top: -6px;
    color: #63718a;
  }

  :deep(.el-sub-menu .el-menu) {
    background: #d8e1fa;
  }

  :deep(.el-sub-menu .el-menu-item),
  :deep(.el-menu--inline .el-sub-menu__title) {
    min-width: 0;
    height: 42px;
    padding-left: 52px !important;
    color: #5c6b82;
    font-size: 14px;
    line-height: 42px;
  }

  :deep(.el-menu--inline .el-menu--inline .el-menu-item),
  :deep(.el-menu--inline .el-menu--inline .el-sub-menu__title) {
    padding-left: 68px !important;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    color: #265fec;
    background: #d8e1fa;
  }

  :deep(.el-menu-item.is-active) {
    color: #265fec;
    font-weight: 600;
    background: #fff;
  }

  :deep(.el-menu-item.is-active .el-icon) {
    color: #265fec;
  }

  // 子菜单选中项只保留蓝色文字，不显示白色背景
  :deep(.el-sub-menu .el-menu-item.is-active) {
    color: #265fec;
    font-weight: 600;
    background: transparent;
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #265fec;
    background: #fff;
  }
}

.sidebar-menu.el-menu--collapse {
  width: 64px;
}
</style>

<style lang="scss">
/* 折叠状态下弹出的子菜单通过 teleport 挂载到 body，需要全局样式 */
.sidebar-popper {
  --el-menu-bg-color: #e5ebfd;
  --el-menu-text-color: #303133;
  --el-menu-hover-bg-color: #d8e1fa;
  --el-menu-hover-text-color: #265fec;
  --el-menu-active-color: #265fec;

  .el-menu--popup {
    background: #e5ebfd;
  }

  .el-menu-item {
    height: 42px;
    line-height: 42px;
    color: #303133;

    &:hover {
      color: #265fec;
      background: #d8e1fa;
    }

    &.is-active {
      color: #265fec;
      font-weight: 600;
      background: transparent;
    }
  }
}
</style>
