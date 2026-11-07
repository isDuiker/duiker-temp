<template>
  <el-date-picker
    ref="datePickerRef"
    v-model="valueRange"
    :type="type"
    :format="format"
    :value-format="valueFormat || format"
    :range-separator="rangeSeparator"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :default-value="defaultDateRange"
    :shortcuts="shortcuts"
    unlink-panels
    v-bind="attrs"
    :style="{ width }"
  />
</template>

<script setup>
import { computed, ref, useAttrs } from "vue";

defineOptions({
  name: "d-datetime-select",
  inheritAttrs: false,
});

const props = defineProps({
  startDate: {
    type: String,
    default: "",
  },
  endDate: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "daterange",
  },
  format: {
    type: String,
    default: "YYYY-MM-DD",
  },
  valueFormat: {
    type: String,
    default: "",
  },
  startPlaceholder: {
    type: String,
    default: "开始时间",
  },
  endPlaceholder: {
    type: String,
    default: "结束时间",
  },
  rangeSeparator: {
    type: String,
    default: "至",
  },
  historyResearch: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: "380px",
  },
});

const emit = defineEmits(["update:startDate", "update:endDate", "change"]);
const attrs = useAttrs();
const datePickerRef = ref(null);
const internalRange = ref([]);

const valueRange = computed({
  get() {
    return props.startDate && props.endDate
      ? [props.startDate, props.endDate]
      : internalRange.value;
  },
  set(value) {
    const range = Array.isArray(value) ? value : [];
    const startDate = range[0] || "";
    const endDate = range[1] || "";

    internalRange.value = startDate && endDate ? [startDate, endDate] : [];
    emit("update:startDate", startDate);
    emit("update:endDate", endDate);
    emit("change", { startDate, endDate });
  },
});

const defaultDateRange = computed(() => {
  if (!props.historyResearch) return undefined;

  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);

  return [start, end];
});

function createRecentRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return [start, end];
}

const shortcuts = [
  {
    text: "最近一周",
    value: () => createRecentRange(7),
  },
  {
    text: "最近一个月",
    value: () => createRecentRange(30),
  },
  {
    text: "最近三个月",
    value: () => createRecentRange(90),
  },
];

function clearValueRange() {
  valueRange.value = [];
}

function focus() {
  datePickerRef.value?.focus?.();
}

defineExpose({
  datePickerRef,
  clearValueRange,
  focus,
});
</script>
