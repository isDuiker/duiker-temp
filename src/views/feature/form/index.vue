<template>
  <div class="container">
    <h2 class="page-title">复杂表单</h2>
    <p class="page-tip">
      演示 d-dialog：拖动标题栏可移动，拖拽四个角可调整大小。
    </p>

    <el-button type="primary" @click="dialogVisible = true">
      打开可拖拽弹窗
    </el-button>

    <d-dialog
      v-model="dialogVisible"
      title="设备信息编辑"
      width="640px"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px" label-position="left">
        <el-form-item label="设备名称">
          <el-input v-model="form.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备编码">
          <el-input v-model="form.code" placeholder="请输入设备编码" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </d-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";

const dialogVisible = ref(false);

const form = reactive({
  name: "设备-01",
  code: "EQ-1001",
  owner: "张伟",
  status: "enabled",
  remark: "这是一段用于演示弹窗内部滚动的备注内容。",
});

function handleConfirm() {
  dialogVisible.value = false;
  ElMessage.success("已保存设备信息");
}
</script>

<style scoped lang="scss">
.container {
  padding: 4px;
}

.page-title {
  color: var(--app-text);
  font-size: 24px;
  font-weight: 600;
}

.page-tip {
  margin: 8px 0 20px;
  color: var(--app-text-secondary);
  font-size: 13px;
}
</style>
