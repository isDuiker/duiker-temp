<template>
  <el-option :label="source.label" :value="source.value" />
</template>

<script setup>
defineOptions({
  name: "d-virtual-select-option-item",
});

defineProps({
  source: {
    type: Object,
    default: () => ({}),
  },
});
</script>
