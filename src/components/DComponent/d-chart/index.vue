<template>
  <div ref="chartRef" class="d-chart" :style="{ height: chartHeight }"></div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import waldenTheme from "./chart-theme-walden";

defineOptions({
  name: "d-chart",
});

const props = defineProps({
  // 图表配置，推荐使用 options
  options: {
    type: Object,
    default: () => ({}),
  },
  // options 的别名，兼容 option 写法
  option: {
    type: Object,
    default: undefined,
  },
  // 图表高度，数字会自动补 px
  height: {
    type: [String, Number],
    default: "400px",
  },
  // ECharts 主题
  theme: {
    type: String,
    default: "walden",
  },
  // 容器尺寸变化时自动 resize
  autoResize: {
    type: Boolean,
    default: true,
  },
  // echarts.init 的第三个参数
  initOptions: {
    type: Object,
    default: () => ({}),
  },
  // echarts.setOption 的第二个参数
  updateOptions: {
    type: Object,
    default: () => ({}),
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false,
  },
  // 加载状态配置
  loadingOptions: {
    type: Object,
    default: () => ({}),
  },
});

const chartRef = ref(null);
const chart = shallowRef(null);

let echartsPromise = null;
let resizeObserver = null;
let initVersion = 0;

function loadEcharts() {
  if (!echartsPromise) {
    echartsPromise = import("echarts")
      .then((module) => {
        module.registerTheme("walden", waldenTheme);
        return module;
      })
      .catch((error) => {
        echartsPromise = null;
        throw error;
      });
  }
  return echartsPromise;
}

const chartHeight = computed(() => {
  if (typeof props.height === "number") {
    return `${props.height}px`;
  }
  return props.height || "400px";
});

const resolvedOptions = computed(() => {
  const options = props.options;
  if (options && Object.keys(options).length) {
    return options;
  }
  return props.option || options || {};
});

function applyOptions() {
  if (!chart.value) return;

  const options = resolvedOptions.value;
  if (!options || !Object.keys(options).length) {
    chart.value.clear();
    return;
  }

  chart.value.setOption(options, props.updateOptions);
}

function updateLoading() {
  if (!chart.value) return;

  if (props.loading) {
    chart.value.showLoading("default", {
      text: "加载中...",
      ...props.loadingOptions,
    });
  } else {
    chart.value.hideLoading();
  }
}

function resize() {
  chart.value?.resize();
}

function setupAutoResize() {
  if (!props.autoResize || !chartRef.value) return;

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(chartRef.value);
  }

  window.addEventListener("resize", resize);
}

function teardownAutoResize() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener("resize", resize);
}

function destroyChart() {
  teardownAutoResize();

  if (chart.value) {
    chart.value.dispose();
    chart.value = null;
  }
}

function dispose() {
  initVersion += 1;
  destroyChart();
}

async function initChart() {
  if (!chartRef.value) return;

  const version = ++initVersion;
  destroyChart();

  try {
    const echarts = await loadEcharts();
    if (version !== initVersion || !chartRef.value) return;

    chart.value = echarts.init(
      chartRef.value,
      props.theme || undefined,
      props.initOptions,
    );

    applyOptions();
    updateLoading();
    setupAutoResize();
  } catch (error) {
    console.error("[d-chart] 加载 ECharts 失败:", error);
  }
}

watch(
  resolvedOptions,
  () => {
    applyOptions();
  },
  { deep: true },
);

watch(
  () => props.updateOptions,
  () => {
    applyOptions();
  },
  { deep: true },
);

watch(
  () => props.loading,
  () => {
    updateLoading();
  },
);

watch(
  () => props.theme,
  () => {
    nextTick(initChart);
  },
);

watch(
  () => props.autoResize,
  (enabled) => {
    teardownAutoResize();
    if (enabled) {
      setupAutoResize();
      resize();
    }
  },
);

onMounted(() => {
  initChart();
});

onBeforeUnmount(() => {
  dispose();
});

defineExpose({
  chart,
  getInstance: () => chart.value,
  resize,
  dispose,
  setOption: (option, options) => chart.value?.setOption(option, options),
  clear: () => chart.value?.clear(),
  showLoading: (type, options) => chart.value?.showLoading(type, options),
  hideLoading: () => chart.value?.hideLoading(),
});
</script>

<style scoped lang="scss">
.d-chart {
  width: 100%;
  min-height: 0;
}
</style>
