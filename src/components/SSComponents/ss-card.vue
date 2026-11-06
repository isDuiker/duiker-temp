<template>
  <div class="card">
    <slot></slot>
  </div>
</template>
<style scoped lang="scss">
// 引入主题颜色变量
@use "@/styles/mixins" as mixins;

.card {
  height: 100%;
  padding: 12px;
  background: var(--el-bg-color, #fff);
  border: 1px solid;
  @include mixins.theme-border;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgb(46 70 105 / 6%);
}
</style>
