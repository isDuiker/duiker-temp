<template>
  <div class="container">
    <h2 class="page-title">复杂表单</h2>
    <p class="page-tip">
      演示 d-dialog 弹窗和 d-query-select 查询选择组件。
    </p>

    <el-button type="primary" @click="dialogVisible = true">
      打开可拖拽弹窗
    </el-button>

    <d-card class="query-select-demo">
      <div class="demo-header">
        <h3>查询选择组件示例</h3>
        <p>
          支持普通下拉、虚拟滚动、多选、单选按钮组、多选按钮组和远程搜索。
        </p>
      </div>

      <el-form label-width="150px" class="demo-form">
        <el-form-item label="普通下拉">
          <d-query-select
            v-model="selectForm.basic"
            :option-list="basicOptions"
            placeholder="请选择"
          />
        </el-form-item>

        <el-form-item label="虚拟滚动（1000 条）">
          <d-query-select
            v-model="selectForm.virtual"
            :option-list="virtualOptions"
            use-virtual
            placeholder="请选择，支持输入过滤"
          />
        </el-form-item>

        <el-form-item label="多选下拉">
          <d-query-select
            v-model="selectForm.multiple"
            :option-list="basicOptions"
            multiple
            placeholder="请选择"
          />
        </el-form-item>

        <el-form-item label="单选按钮组">
          <d-query-select
            v-model="selectForm.radio"
            :option-list="basicOptions"
            type="radio"
          />
        </el-form-item>

        <el-form-item label="多选按钮组">
          <d-query-select
            v-model="selectForm.checkbox"
            :option-list="basicOptions"
            type="checkbox"
          />
        </el-form-item>

        <el-form-item label="远程搜索">
          <d-query-select
            v-model="selectForm.remote"
            :get="getRemoteOptions"
            remote-search
            use-virtual
            placeholder="输入关键字搜索"
          />
        </el-form-item>
      </el-form>
    </d-card>

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

const basicOptions = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
  { label: "选项四", value: "4" },
];

const virtualOptions = Array.from({ length: 1000 }, (_, index) => {
  const value = index + 1;
  return {
    label: `虚拟选项 ${value}`,
    value: String(value),
  };
});

const remoteSource = Array.from({ length: 200 }, (_, index) => {
  const value = index + 1;
  return {
    label: `远程选项 ${value}`,
    value: String(value),
  };
});

const selectForm = reactive({
  basic: "",
  virtual: "",
  multiple: [],
  radio: "",
  checkbox: [],
  remote: "",
});

function getRemoteOptions(params) {
  const keyword = String(params?.value ?? "")
    .trim()
    .toLowerCase();

  const result = keyword
    ? remoteSource.filter((item) =>
        item.label.toLowerCase().includes(keyword),
      )
    : [];

  return Promise.resolve(result);
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

.query-select-demo {
  max-width: 900px;
  margin-top: 20px;
}

.demo-header {
  margin-bottom: 20px;

  h3 {
    margin-bottom: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--app-text);
  }

  p {
    font-size: 14px;
    color: var(--app-muted);
  }
}

.demo-form {
  max-width: 620px;
}
</style>
