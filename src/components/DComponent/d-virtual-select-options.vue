<template>
  <div
    ref="containerRef"
    class="d-virtual-select-options"
    @scroll.passive="handleScroll"
  >
    <div
      class="d-virtual-select-options__phantom"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="d-virtual-select-options__list"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <d-virtual-select-option-item
          v-for="item in visibleOptions"
          :key="item.value"
          :source="item"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import DVirtualSelectOptionItem from "./d-virtual-select-option-item.vue";

defineOptions({
  name: "d-virtual-select-options",
  inheritAttrs: false,
});

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  valueKey: {
    type: String,
    default: "value",
  },
  labelKey: {
    type: String,
    default: "label",
  },
  estimateSize: {
    type: Number,
    default: 34,
  },
});

const BUFFER_SIZE = 4;
const MAX_HEIGHT = 245;

const containerRef = ref(null);
const scrollTop = ref(0);

const dataSources = computed(() =>
  props.options.map((item) => ({
    label: item[props.labelKey],
    value: item[props.valueKey],
  })),
);

const itemHeight = computed(() => {
  const size = Number(props.estimateSize);
  return size > 0 ? size : 34;
});

const totalHeight = computed(
  () => dataSources.value.length * itemHeight.value,
);

const visibleCount = computed(
  () => Math.ceil(MAX_HEIGHT / itemHeight.value) + BUFFER_SIZE * 2,
);

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - BUFFER_SIZE),
);

const endIndex = computed(() =>
  Math.min(dataSources.value.length, startIndex.value + visibleCount.value),
);

const visibleOptions = computed(() =>
  dataSources.value.slice(startIndex.value, endIndex.value),
);

const offsetY = computed(() => startIndex.value * itemHeight.value);

function handleScroll(event) {
  scrollTop.value = event.target.scrollTop;
}

function reset() {
  scrollTop.value = 0;
  if (containerRef.value) {
    containerRef.value.scrollTop = 0;
  }
}

watch(
  () => props.options,
  () => {
    reset();
  },
);

onMounted(reset);

defineExpose({
  reset,
});
</script>

<style scoped lang="scss">
.d-virtual-select-options {
  max-height: 245px;
  overflow-x: hidden;
  overflow-y: auto;

  &__phantom {
    position: relative;
    width: 100%;
  }

  &__list {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
  }
}
</style>
