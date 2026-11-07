<template>
  <d-querybox
    :params="query"
    :auto-query="false"
    @submit="handleSearch"
    @reset="handleReset"
    @resize="handleQueryResize"
  >
    <el-form-item label="名称">
      <el-input v-model="query.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item label="编码">
      <el-input v-model="query.code" placeholder="请输入编码" />
    </el-form-item>
    <el-form-item label="状态">
      <el-select
        v-model="query.status"
        placeholder="请选择状态"
        style="width: 200px"
      >
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
      </el-select>
    </el-form-item>
    <el-form-item label="负责人">
      <el-input v-model="query.owner" placeholder="请输入负责人" />
    </el-form-item>
    <el-form-item label="创建日期">
      <el-date-picker
        v-model="query.date"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="请选择日期"
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
      <el-button type="primary" :icon="Plus" @click="handleAdd">
        新增
      </el-button>
      <el-button
        type="danger"
        plain
        :icon="Delete"
        :disabled="selectedRows.length === 0"
        @click="handleBatchDelete"
      >
        删除
      </el-button>
      <el-button :icon="Upload" @click="handleImport">导入</el-button>
      <el-button :icon="Download" @click="handleExport">导出</el-button>
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
      <el-button link type="primary" @click="handleView(row)"> 查看 </el-button>
      <el-button link type="danger" @click="handleDelete(row)">
        删除
      </el-button>
    </template>
  </d-table>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Delete, Download, Plus, Upload } from "@element-plus/icons-vue";
import {
  createDevice,
  deleteDevice,
  deleteDevices,
  getDeviceList,
} from "@/api";

const createQuery = () => ({
  name: "",
  code: "",
  status: "",
  owner: "",
  date: "",
  remark: "",
});

const query = reactive(createQuery());
const tableRef = ref(null);
const selectedRows = ref([]);

const statusMap = {
  enabled: "启用",
  disabled: "停用",
};

function statusLabel(status) {
  return statusMap[status] || "-";
}

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
  {
    prop: "actions",
    label: "操作",
    minWidth: 140,
    slot: "actions",
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

function handleQueryResize() {
  tableRef.value?.resize();
}

function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

async function handleAdd() {
  try {
    await createDevice({
      name: `新增设备-${Date.now().toString().slice(-4)}`,
      owner: "张伟",
      status: "enabled",
      remark: "新增设备",
    });
    tableRef.value?.loadTableData();
    ElMessage.success("已新增一条设备");
  } catch (error) {
    console.error(error);
  }
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) return;

  const ids = selectedRows.value.map((row) => row.id);

  try {
    await deleteDevices(ids);
    tableRef.value?.clearSelection();
    tableRef.value?.loadTableData();
    ElMessage.success(`已删除 ${ids.length} 条数据`);
  } catch (error) {
    console.error(error);
  }
}

function handleImport() {
  ElMessage.info("导入按钮示例：可接入文件上传逻辑");
}

function handleExport() {
  ElMessage.info("导出按钮示例：可接入导出接口");
}

function handleView(row) {
  ElMessage.info(`查看：${row.name}`);
}

async function handleDelete(row) {
  try {
    await deleteDevice(row.id);
    tableRef.value?.loadTableData();
    ElMessage.success(`已删除：${row.name}`);
  } catch (error) {
    console.error(error);
  }
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
</style>
