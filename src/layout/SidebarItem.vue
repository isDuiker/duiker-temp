<template>
  <el-menu-item v-if="!item.children?.length" :index="item.path">
    <el-icon v-if="item.icon">
      <component :is="item.icon" />
    </el-icon>
    <template #title>
      <span>{{ item.title }}</span>
    </template>
  </el-menu-item>

  <el-sub-menu v-else :index="item.path || item.title" popper-class="sidebar-popper">
    <template #title>
      <el-icon v-if="item.icon">
        <component :is="item.icon" />
      </el-icon>
      <span>{{ item.title }}</span>
    </template>

    <SidebarItem
      v-for="child in item.children"
      :key="child.path"
      :item="child"
    />
  </el-sub-menu>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>
