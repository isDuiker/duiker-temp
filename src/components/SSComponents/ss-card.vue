<template>
  <div class="card">
    <slot></slot>
  </div>
</template>
<style scoped lang="scss">
.card {
  height: 100%;
  padding: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 4px;
  box-shadow: var(--app-shadow);
}
</style>
