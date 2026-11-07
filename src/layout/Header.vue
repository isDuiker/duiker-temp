<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";
import {
  ArrowDown,
  Bell,
  Expand,
  Fold,
  Moon,
  Sunny,
  User,
} from "@element-plus/icons-vue";
import { useThemeStore } from "@/stores/index";

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toggle"]);

const router = useRouter();
const themeStore = useThemeStore();

const themeIcon = computed(() =>
  themeStore.currentTheme === "dark" ? Sunny : Moon
);
const themeLabel = computed(() =>
  themeStore.currentTheme === "dark" ? "切换浅色主题" : "切换深色主题"
);

const goHome = () => {
  router.push({ name: "home" });
};

function handleUserCommand(command) {
  if (command === "password") {
    ElMessage.info("修改密码功能待接入");
    return;
  }

  if (command === "logout") {
    localStorage.removeItem("token");
    ElMessage.success("已退出登录");
    router.replace({ name: "login" });
  }
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <button
        class="collapse-trigger"
        type="button"
        :aria-label="collapsed ? '展开导航' : '收起导航'"
        @click="emit('toggle')"
      >
        <el-icon :size="18">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
      </button>

      <div class="brand" @click="goHome">
        <!-- <img src="/favicon.svg" alt="logo" /> -->
        <span>Quickly developed template</span>
      </div>
    </div>

    <div class="header-actions">
      <router-link class="workbench-entry" :to="{ name: 'home' }">
        <el-icon :size="16"><Bell /></el-icon>
        <span>工作台</span>
      </router-link>
      
      <button
        class="icon-button"
        type="button"
        :aria-label="themeLabel"
        :title="themeLabel"
        @click="themeStore.toggleTheme"
      >
        <el-icon :size="18">
          <component :is="themeIcon" />
        </el-icon>
      </button>

      <el-dropdown trigger="click" @command="handleUserCommand">
        <button class="user-trigger" type="button" aria-label="账号菜单">
          <el-icon :size="16"><User /></el-icon>
          <span>admin</span>
          <el-icon class="user-chevron" :size="12"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  grid-area: header;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  height: 50px;
  padding-right: 16px;
  color: var(--app-header-fg);
  background: var(--app-header-bg);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.collapse-trigger {
  width: 56px;
  height: 100%;
  flex: 0 0 56px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--app-header-fg);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--app-header-hover);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;

  img {
    flex: none;
    width: 28px;
    height: 28px;
  }

  span {
    overflow: hidden;
    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--app-header-fg);
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--app-header-hover);
  }
}

.workbench-entry {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  color: var(--app-header-fg);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s;

  &:hover {
    color: var(--app-header-fg);
    background: var(--app-header-hover);
  }
}

.user-trigger {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  padding: 0 8px 0 16px;
  color: var(--app-header-fg);
  font-size: 14px;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--app-header-border);
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--app-header-hover);
  }
}

.user-chevron {
  margin-left: 2px;
  font-size: 12px;
}
</style>
