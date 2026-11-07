<template>
  <div class="test-page">
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
      :page-size="5"
      :page-sizes="[5, 10, 20]"
      selection
      immediate
      storage-key="test-d-table"
      @selection-change="handleSelectionChange"
    >
      <template #top-left>
        <span class="table-title">设备列表</span>
        <span class="table-selected">已选 {{ selectedRows.length }} 项</span>
      </template>

      <template #top-right>
        <el-button @click="tableRef?.loadTableData()">刷新</el-button>
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
        <el-button link type="primary" @click="handleView(row)">
          查看
        </el-button>
        <el-button link type="danger" @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </d-table>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";

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

const rows = ref(
  Array.from({ length: 48 }, (_, index) => ({
    id: index + 1,
    name: `设备-${String(index + 1).padStart(2, "0")}`,
    code: `EQ-${1001 + index}`,
    status: index % 4 === 0 ? "disabled" : "enabled",
    owner: ["张伟", "李娜", "王强", "赵敏"][index % 4],
    date: `2026-${String((index % 12) + 1).padStart(2, "0")}-${String(
      (index % 27) + 1,
    ).padStart(2, "0")}`,
    remark: index % 3 === 0 ? "需要定期维护" : "运行正常",
  })),
);

const columns = [
  {
    prop: "name",
    label: "设备名称",
    minWidth: 140,
    sortable: "custom",
  },
  {
    prop: "code",
    label: "设备编码",
    width: 120,
    sortable: false,
  },
  {
    prop: "status",
    label: "状态",
    width: 90,
    align: "center",
    slot: "status",
    sortable: false,
  },
  {
    prop: "owner",
    label: "负责人",
    width: 100,
    sortable: false,
  },
  {
    prop: "date",
    label: "创建日期",
    width: 120,
    sortable: "custom",
  },
  {
    prop: "remark",
    label: "备注",
    minWidth: 160,
    showOverflowTooltip: true,
    sortable: false,
  },
  {
    prop: "actions",
    label: "操作",
    width: 140,
    align: "right",
    slot: "actions",
    sortable: false,
  },
];

function compareRows(a, b, params) {
  const ascFields = String(params.ascs || "")
    .split(",")
    .filter(Boolean);
  const descFields = String(params.descs || "")
    .split(",")
    .filter(Boolean);

  const fields = [
    ...ascFields.map((field) => [field, 1]),
    ...descFields.map((field) => [field, -1]),
  ];

  for (const [field, direction] of fields) {
    const left = a[field];
    const right = b[field];
    if (left === right) continue;
    if (left == null) return 1;
    if (right == null) return -1;
    return left > right ? direction : -direction;
  }

  return 0;
}

async function getTableData(params = {}) {
  const filtered = rows.value
    .filter((row) => !params.status || row.status === params.status)
    .filter((row) => !params.owner || row.owner.includes(params.owner))
    .filter((row) => !params.date || row.date === params.date)
    .filter((row) => !params.remark || row.remark.includes(params.remark))
    .sort((a, b) => compareRows(a, b, params));

  const current = Number(params.current) || 1;
  const size = Number(params.size) || 5;
  const start = (current - 1) * size;

  // 模拟接口请求
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    records: filtered.slice(start, start + size),
    total: filtered.length,
  };
}

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

function handleView(row) {
  ElMessage.info(`查看：${row.name}`);
}

async function handleDelete(row) {
  rows.value = rows.value.filter((item) => item.id !== row.id);
  tableRef.value?.loadTableData();
  ElMessage.success(`已删除：${row.name}`);
}
</script>

<style scoped lang="scss">
.test-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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
