<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const breadcrumbItems = computed(() => {
  const matched = route.matched.filter(
    (item) => item.meta?.title && item.name !== "layout"
  );

  if (!matched.length) return [];

  const items = matched.map((item, index) => ({
    title: item.meta.title,
    path: index === matched.length - 1 ? "" : item.path,
  }));

  // 首页始终作为第一级
  if (route.name !== "home") {
    items.unshift({ title: "首页", path: "/home" });
  }

  return items;
});
</script>

<template>
  <nav class="page-trail" aria-label="面包屑导航">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        v-for="item in breadcrumbItems"
        :key="item.title"
        :to="item.path || undefined"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </nav>
</template>

<style scoped lang="scss">
.page-trail {
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

:deep(.el-breadcrumb__inner) {
  display: inline;
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;
}

:deep(.el-breadcrumb__inner.is-link) {
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;

  &:hover {
    color: var(--el-color-primary, #426ec4);
  }
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--el-text-color-secondary, #808080);
  font-weight: 400;
}

:deep(.el-breadcrumb__separator) {
  color: var(--el-text-color-secondary, #808080);
}
</style>
