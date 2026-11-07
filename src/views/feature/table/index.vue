<template>
  <d-querybox
    :params="query"
    :auto-query="false"
    @submit="handleSearch"
    @reset="handleReset"
  >
    <el-form-item label="名称">
      <el-input v-model="query.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item label="编码">
      <el-input v-model="query.code" placeholder="请输入编码" />
    </el-form-item>
    <el-form-item label="状态">
      <d-query-select
        v-model="query.status"
        :option-list="statusOptions"
        placeholder="请选择状态"
      />
    </el-form-item>
    <el-form-item label="负责人">
      <el-input v-model="query.owner" placeholder="请输入负责人" />
    </el-form-item>
    <el-form-item label="创建日期">
      <d-datetime-select
        v-model:startDate="query.startDate"
        v-model:endDate="query.endDate"
        width="320px"
      />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="query.remark" placeholder="请输入备注" />
    </el-form-item>
  </d-querybox>
  <d-table
    ref="tableRef"
    :params="query"
    :get="getTableData"
    :columns="columns"
    :page-size="10"
    :page-sizes="[10, 20, 50, 100, 500]"
    selection
    immediate
    storage-key="test-d-table"
    @selection-change="handleSelectionChange"
  >
    <template #top-left>
      <span class="table-title">设备列表</span>
      <span class="table-selected">已选 {{ selectedRows.length }} 项</span>
    </template>

    <template #toolbar>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        新增
      </el-button>
      <el-button
        type="danger"
        plain
        :icon="Delete"
        :disabled="selectedRows.length === 0"
        @click="openBatchDeleteDialog"
      >
        删除
      </el-button>
      <d-import
        url="/devices/import"
        :params="query"
        @success="handleImportSuccess"
      >
        <el-icon><Upload /></el-icon>
        导入
      </d-import>
      <d-export
        url="/devices/export"
        :params="query"
        filename="设备列表.xlsx"
        @success="handleExportSuccess"
      >
        <el-icon><Download /></el-icon>
        导出
      </d-export>
    </template>

    <template #status="{ row }">
      <el-tag
        :type="row.status === 'enabled' ? 'success' : 'info'"
        size="small"
      >
        {{ statusLabel(row.status) }}
      </el-tag>
    </template>

    <template #actions="{ row }">
      <el-button link type="primary" @click="openEditDialog(row)">
        编辑
      </el-button>
      <el-button link type="danger" @click="openDeleteDialog(row)">
        删除
      </el-button>
    </template>
  </d-table>

  <d-dialog
    v-model="formDialogVisible"
    :title="isEditing ? '编辑设备' : '新增设备'"
    width="560px"
    destroy-on-close
    @closed="resetDeviceForm"
  >
    <el-form
      ref="deviceFormRef"
      :model="deviceForm"
      :rules="deviceRules"
      label-width="90px"
      label-position="left"
      @submit.prevent
    >
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备编码" prop="code">
        <el-input v-model="deviceForm.code" placeholder="请输入设备编码" />
      </el-form-item>
      <el-form-item label="负责人" prop="owner">
        <el-input v-model="deviceForm.owner" placeholder="请输入负责人" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <d-query-select
          v-model="deviceForm.status"
          :option-list="statusOptions"
          :clearable="false"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="deviceForm.remark"
          type="textarea"
          :rows="4"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="formDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleDeviceSubmit">
        确定
      </el-button>
    </template>
  </d-dialog>

  <d-dialog
    v-model="deleteDialogVisible"
    title="删除确认"
    width="420px"
    :resizable="false"
    @closed="resetPendingDeleteIds"
  >
    <div class="delete-confirm">
      <el-icon :size="22"><WarningFilled /></el-icon>
      <span>{{ deleteConfirmText }}</span>
    </div>

    <template #footer>
      <el-button @click="deleteDialogVisible = false">取消</el-button>
      <el-button
        type="danger"
        :loading="deleting"
        @click="confirmDelete"
      >
        确定删除
      </el-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  Delete,
  Download,
  Plus,
  Upload,
  WarningFilled,
} from "@element-plus/icons-vue";
import {
  createDevice,
  deleteDevices,
  getDeviceList,
  updateDevice,
} from "@/api";

const createQuery = () => ({
  name: "",
  code: "",
  status: "",
  owner: "",
  startDate: "",
  endDate: "",
  remark: "",
});

const query = reactive(createQuery());
const tableRef = ref(null);
const selectedRows = ref([]);

const statusMap = {
  enabled: "启用",
  disabled: "停用",
};

const statusOptions = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];

function statusLabel(status) {
  return statusMap[status] || "-";
}

const createDeviceForm = () => ({
  name: "",
  code: "",
  owner: "",
  status: "enabled",
  remark: "",
});

const formDialogVisible = ref(false);
const deviceFormRef = ref(null);
const deviceForm = reactive(createDeviceForm());
const editingId = ref(null);
const saving = ref(false);
const isEditing = computed(() => editingId.value !== null);

const deviceRules = {
  name: [{ required: true, message: "请输入设备名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入设备编码", trigger: "blur" }],
  owner: [{ required: true, message: "请输入负责人", trigger: "blur" }],
};

const deleteDialogVisible = ref(false);
const pendingDeleteIds = ref([]);
const deleting = ref(false);
const deleteConfirmText = computed(() =>
  pendingDeleteIds.value.length > 1
    ? `确定删除已选中的 ${pendingDeleteIds.value.length} 条设备数据吗？`
    : "确定删除该设备数据吗？"
);

const columns = [
  {
    prop: "name",
    label: "设备名称",
    minWidth: 120,
    sortable: "custom",
  },
  {
    prop: "code",
    label: "设备编码",
    minWidth: 120,
    sortable: "custom",
  },
  {
    prop: "status",
    label: "状态",
    minWidth: 110,
    slot: "status",
    sortable: "custom",
  },
  {
    prop: "owner",
    label: "负责人",
    minWidth: 120,
    sortable: "custom",
  },
  {
    prop: "date",
    label: "创建日期",
    minWidth: 160,
    sortable: "custom",
  },
  {
    prop: "remark",
    label: "备注",
    minWidth: 170,
    showOverflowTooltip: true,
    sortable: "custom",
  },
];

const getTableData = (params) => getDeviceList(params);

function handleSearch() {
  tableRef.value?.loadTableData();
}

function handleReset() {
  Object.assign(query, createQuery());
  tableRef.value?.loadTableData();
}

function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

function openCreateDialog() {
  editingId.value = null;
  Object.assign(deviceForm, createDeviceForm());
  formDialogVisible.value = true;
}

function openEditDialog(row) {
  editingId.value = row.id;
  Object.assign(deviceForm, {
    name: row.name || "",
    code: row.code || "",
    owner: row.owner || "",
    status: row.status || "enabled",
    remark: row.remark || "",
  });
  formDialogVisible.value = true;
}

function resetDeviceForm() {
  editingId.value = null;
  Object.assign(deviceForm, createDeviceForm());
  deviceFormRef.value?.clearValidate?.();
}

async function handleDeviceSubmit() {
  if (!deviceFormRef.value) return;

  try {
    await deviceFormRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;

  try {
    if (editingId.value !== null) {
      await updateDevice(editingId.value, { ...deviceForm });
      ElMessage.success("设备信息已更新");
    } else {
      await createDevice({ ...deviceForm });
      ElMessage.success("设备已新增");
    }

    formDialogVisible.value = false;
    tableRef.value?.loadTableData();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

function openBatchDeleteDialog() {
  if (!selectedRows.value.length) return;

  pendingDeleteIds.value = selectedRows.value.map((row) => row.id);
  deleteDialogVisible.value = true;
}

function openDeleteDialog(row) {
  pendingDeleteIds.value = [row.id];
  deleteDialogVisible.value = true;
}

function resetPendingDeleteIds() {
  pendingDeleteIds.value = [];
}

async function confirmDelete() {
  if (!pendingDeleteIds.value.length) return;

  deleting.value = true;

  try {
    const count = pendingDeleteIds.value.length;
    await deleteDevices(pendingDeleteIds.value);
    tableRef.value?.clearSelection();
    tableRef.value?.loadTableData();
    deleteDialogVisible.value = false;
    ElMessage.success(`已删除 ${count} 条数据`);
  } catch (error) {
    console.error(error);
  } finally {
    deleting.value = false;
  }
}

function handleImportSuccess() {
  tableRef.value?.loadTableData();
}

function handleExportSuccess() {
  ElMessage.success("导出成功");
}
</script>

<style scoped lang="scss">

.table-title {
  color: var(--app-text);
  font-size: 15px;
  font-weight: 600;
}

.table-selected {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.delete-confirm {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--app-text);
  line-height: 1.6;

  .el-icon {
    flex: none;
    margin-top: 2px;
    color: var(--el-color-warning);
  }
}
</style>
