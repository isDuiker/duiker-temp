<template>
  <el-button type="primary" plain :loading="loading" @click="onExport">
    <slot>导出</slot>
  </el-button>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { downloadFile } from "@/utils/request";

defineOptions({
  name: "d-export",
});

const props = defineProps({
  params: {
    type: Object,
    default: () => ({}),
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["success", "error"]);

const loading = ref(false);

async function onExport() {
  loading.value = true;

  try {
    await downloadFile(props.url, props.params, props.filename);
    emit("success");
  } catch (error) {
    emit("error", error);
    ElMessage.error(error?.message || "导出失败");
  } finally {
    loading.value = false;
  }
}

defineExpose({
  export: onExport,
});
</script>
