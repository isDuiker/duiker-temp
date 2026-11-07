<template>
  <div class="d-graph-title">
    <span class="d-graph-title__bar"></span>
    <span class="d-graph-title__text">{{ title }}</span>
  </div>
</template>

<script setup>
defineOptions({
  name: "d-graph-title",
});

defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.d-graph-title {
  display: flex;
  align-items: center;
}

.d-graph-title__bar {
  width: 4px;
  height: 20px;
  border-radius: 4px;
  background: var(--el-color-primary);
}

.d-graph-title__text {
  margin-left: 8px;
  color: var(--app-text);
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
}
</style>
