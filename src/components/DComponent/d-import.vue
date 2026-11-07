<template>
  <el-button type="primary" plain @click="open">
    <slot>导入</slot>
  </el-button>

  <d-dialog
    v-model="visible"
    title="导入"
    width="600px"
    :resizable="false"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="d-import">
      <el-upload
        ref="uploadRef"
        v-bind="attrs"
        action="#"
        drag
        :before-upload="beforeUpload"
        :http-request="handleUpload"
        :limit="limit"
        :accept="accept"
        :disabled="uploading"
        style="width: 100%"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">支持 {{ accept }} 文件</div>
        </template>
      </el-upload>
    </div>

    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { ref, useAttrs } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import request from "@/utils/request";

defineOptions({
  name: "d-import",
  inheritAttrs: false,
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
  limit: {
    type: Number,
    default: 1,
  },
  accept: {
    type: String,
    default: ".xls,.xlsx",
  },
});

const emit = defineEmits(["success", "error"]);
const attrs = useAttrs();

const visible = ref(false);
const uploadRef = ref(null);
const uploading = ref(false);

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
}

function handleClosed() {
  uploadRef.value?.clearFiles?.();
  uploading.value = false;
}

function beforeUpload(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowed = props.accept
    .split(",")
    .map((item) => item.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);

  if (extension && allowed.length && !allowed.includes(extension)) {
    ElMessage.warning(`只能上传 ${props.accept} 格式的文件`);
    return false;
  }

  return true;
}

async function handleUpload(options) {
  const formData = new FormData();
  formData.append("file", options.file);

  Object.entries(props.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  uploading.value = true;

  try {
    const response = await request.post(props.url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    options.onSuccess?.(response);
    emit("success", response);
    ElMessage.success("上传成功");
    close();
  } catch (error) {
    options.onError?.(error);
    emit("error", error);
    uploadRef.value?.clearFiles?.();
  } finally {
    uploading.value = false;
  }
}

defineExpose({
  open,
  close,
});
</script>

<style lang="scss" scoped>
:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

:deep(.el-icon--upload) {
  margin-bottom: 12px;
  color: var(--el-text-color-placeholder);
  font-size: 48px;
}
</style>
