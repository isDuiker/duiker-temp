<template>
  <div class="d-chart-box" :class="{ 'is-border': border, 'is-shadow': shadow }">
    <div class="d-chart-box__header">
      <div class="d-chart-box__title">
        <slot name="title">
          <d-graph-title v-if="title" :title="title" />
        </slot>
      </div>
      <div class="d-chart-box__extra">
        <slot name="search" />
      </div>
    </div>

    <div class="d-chart-box__content" :style="contentStyle">
      <slot />
      <div v-if="isDataEmpty()" class="d-chart-box__empty">
        <span>暂无数据</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { isVNode, useSlots } from "vue";

defineOptions({
  name: "d-chart-box",
});

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  border: {
    type: Boolean,
    default: false,
  },
  shadow: {
    type: Boolean,
    default: true,
  },
  contentStyle: {
    type: Object,
    default: () => ({}),
  },
});

const slots = useSlots();

function findChartOptions(nodes) {
  if (!Array.isArray(nodes)) return undefined;

  for (const vnode of nodes) {
    if (!isVNode(vnode)) continue;

    const name = vnode.type?.name || vnode.type?.__name;
    if (name === "d-chart") {
      return vnode.props?.options ?? vnode.props?.option;
    }

    if (Array.isArray(vnode.children)) {
      const result = findChartOptions(vnode.children);
      if (result !== undefined) return result;
    }
  }

  return undefined;
}

function checkOptionsEmpty(options) {
  if (!options) return true;

  let series = options.series;
  if (!series) return true;
  if (!Array.isArray(series)) series = [series];
  if (!series.length) return true;

  return !series.some(
    (item) => Array.isArray(item?.data) && item.data.length > 0,
  );
}

function isDataEmpty() {
  const options = findChartOptions(slots.default?.() || []);
  if (options === undefined) return false;
  return checkOptionsEmpty(options);
}
</script>

<style scoped lang="scss">
.d-chart-box {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-radius: 4px;

  &.is-border {
    border: 1px solid var(--app-border);
  }

  &.is-shadow {
    box-shadow: var(--app-shadow);
  }
}

.d-chart-box__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex: 0 0 auto;
  margin-bottom: 8px;
}

.d-chart-box__title {
  color: var(--app-text);
  font-size: 16px;
  font-weight: 600;
}

.d-chart-box__extra {
  display: flex;
  align-items: center;
}

.d-chart-box__content {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
}

.d-chart-box__content :deep(.d-chart) {
  height: 100% !important;
  min-height: 120px;
}

.d-chart-box__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-muted);
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}
</style>
