<template>
  <div class="d-table" :class="{ 'is-row-clickable': rowClickSelect }">
    <div v-if="showHeader" class="d-table__header">
      <div class="d-table__header-left">
        <slot name="top-left" />
      </div>

      <div class="d-table__header-right">
        <slot name="toolbar" />
        <slot name="top-right" />

        <el-popover
          v-if="showSetCol"
          v-model:visible="columnPanelVisible"
          placement="bottom-end"
          :width="280"
          trigger="click"
          popper-class="d-table-column-popper"
        >
          <template #reference>
            <!-- <el-button text :icon="Setting">列设置</el-button> -->
            <el-button :icon="Setting"></el-button>
          </template>

          <div class="d-table-column-panel">
            <div class="d-table-column-panel__header">
              <span>列设置</span>
              <el-button link type="primary" @click="resetColumns">
                恢复默认
              </el-button>
            </div>

            <div class="d-table-column-panel__list">
              <div
                v-for="(column, index) in filterColumns"
                :key="column.prop"
                class="d-table-column-panel__item"
              >
                <el-checkbox
                  :model-value="!column.hide"
                  @change="onColumnVisibilityChange(column, $event)"
                >
                  {{ column.label }}
                </el-checkbox>

                <div class="d-table-column-panel__actions">
                  <el-button
                    link
                    :disabled="index === 0"
                    @click="moveColumn(index, -1)"
                  >
                    <el-icon><ArrowUp /></el-icon>
                  </el-button>
                  <el-button
                    link
                    :disabled="index === filterColumns.length - 1"
                    @click="moveColumn(index, 1)"
                  >
                    <el-icon><ArrowDown /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <div class="d-table__body">
      <el-table
        ref="tableRef"
        v-bind="attrs"
        v-loading="loading"
        :data="tableData"
        :row-key="rowKey"
        :height="tableHeight"
        style="width: 100%"
        @row-click="handleRowClick"
        @select="handleSelect"
        @selection-change="handleSelectionChange"
        @sort-change="onSortChange"
      >
        <el-table-column v-if="showExpand" type="expand" width="48">
          <template #default="scope">
            <slot name="expand" v-bind="scope" />
          </template>
        </el-table-column>

        <el-table-column
          v-if="selection"
          type="selection"
          width="52"
          align="center"
          :reserve-selection="true"
        />

        <el-table-column
          v-if="showIndex"
          type="index"
          label="序号"
          width="55"
          align="center"
          :index="getRowIndex"
        />

        <el-table-column
          v-for="item in visibleColumns"
          :key="item.prop"
          v-bind="getColumnProps(item)"
          :show-overflow-tooltip="item.showOverflowTooltip ?? true"
        >
          <template #header="{ column }">
            <div
              v-if="isSortable(item)"
              class="d-table__sort-header"
              :class="{ 'is-center': getColumnAlign(item) === 'center' }"
              :style="{ justifyContent: alignToFlex(getColumnAlign(item)) }"
              @click.stop="handleManualSort(item)"
            >
              <span class="d-table__sort-label">{{ column.label }}</span>
              <span class="d-table__sort-carets">
                <el-icon
                  :class="{ active: getSortOrder(item) === 'ascending' }"
                >
                  <CaretTop />
                </el-icon>
                <el-icon
                  :class="{ active: getSortOrder(item) === 'descending' }"
                >
                  <CaretBottom />
                </el-icon>
              </span>
            </div>
            <template v-else>{{ column.label }}</template>
          </template>

          <template #default="{ row }">
            <slot v-if="item.slot" :name="getSlotName(item)" :row="row" />
            <span
              v-else-if="item.onClick"
              class="d-table__clickable"
              @click="item.onClick(row)"
            >
              {{ formatCell(item, row) }}
            </span>
            <template v-else>{{ formatCell(item, row) }}</template>
          </template>
        </el-table-column>

        <slot />

        <el-table-column
          v-if="$slots.actions"
          :label="actionsLabel"
          :width="actionsWidth"
          :align="actionsAlign"
          :fixed="actionsFixed"
          class-name="d-table__actions-column"
        >
          <template #default="{ row, column, $index }">
            <slot
              name="actions"
              :row="row"
              :column="column"
              :$index="$index"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div
      v-if="showPagination"
      class="d-table__footer"
      :class="{ 'is-split': enableBottomSlot }"
    >
      <div v-if="enableBottomSlot" class="d-table__footer-left">
        <slot name="bottom-left" />
      </div>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        :total="total"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import {
  ArrowDown,
  ArrowUp,
  CaretBottom,
  CaretTop,
  Setting,
} from "@element-plus/icons-vue";
import { ElLoading, ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/loading/style/css";
import { QUERYBOX_RESIZE_EVENT } from "./index";

defineOptions({
  name: "d-table",
  inheritAttrs: false,
});

const props = defineProps({
  params: {
    type: Object,
    default: () => ({}),
  },
  get: {
    type: Function,
    required: true,
  },
  showPagination: {
    type: Boolean,
    default: true,
  },
  showIndex: {
    type: Boolean,
    default: true,
  },
  selection: {
    type: Boolean,
    default: false,
  },
  rowClickSelect: {
    type: Boolean,
    default: true,
  },
  showExpand: {
    type: Boolean,
    default: false,
  },
  columns: {
    type: Array,
    default: () => [],
  },
  autoHeight: {
    type: Boolean,
    default: true,
  },
  showSetCol: {
    type: Boolean,
    default: true,
  },
  heightBuffer: {
    type: Number,
    default: 0,
  },
  filterChartFn: {
    type: Function,
    default: null,
  },
  sortFieldFormatter: {
    type: Function,
    default: null,
  },
  storageKey: {
    type: String,
    default: "",
  },
  autoSave: {
    type: Boolean,
    default: true,
  },
  sortable: {
    type: [String, Boolean],
    default: "custom",
  },
  rowKey: {
    type: String,
    default: "id",
  },
  enableBottomSlot: {
    type: Boolean,
    default: false,
  },
  defaultAlign: {
    type: String,
    default: "center",
  },
  actionsLabel: {
    type: String,
    default: "操作",
  },
  actionsWidth: {
    type: [String, Number],
    default: 140,
  },
  actionsAlign: {
    type: String,
    default: "center",
  },
  actionsFixed: {
    type: [Boolean, String],
    default: "right",
  },
  pageSize: {
    type: Number,
    default: 50,
  },
  pageSizes: {
    type: Array,
    default: () => [50, 100, 200, 500],
  },
  paginationLayout: {
    type: String,
    default: "total, sizes, prev, pager, next, jumper",
  },
  immediate: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "selection-change",
  "change",
  "page-change",
  "sort-change",
]);

const attrs = useAttrs();
const slots = useSlots();
const route = useRoute();

const vLoading = ElLoading.directive;

const tableRef = ref(null);
const tableData = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const currentPageSize = ref(props.pageSize);
const tableHeight = ref("auto");
const selectedRows = ref([]);
const lastClickedIndex = ref(-1);
const sortMap = ref({});
const columnPanelVisible = ref(false);

const filterColumns = ref([]);
const initialColumns = ref([]);

const showHeader = computed(
  () => !!(slots["top-left"] || slots["top-right"]) || props.showSetCol
);

const visibleColumns = computed(() =>
  filterColumns.value
    .filter((column) => !column.hide)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
);

const sortParams = computed(() => {
  const ascs = [];
  const descs = [];

  Object.entries(sortMap.value).forEach(([field, order]) => {
    if (order === "ascending") ascs.push(field);
    if (order === "descending") descs.push(field);
  });

  return {
    ascs: ascs.join(","),
    descs: descs.join(","),
  };
});

function normalizeColumns(columns) {
  return columns.map((column, index) => ({
    ...column,
    hide: !!column.hide,
    sortable:
      column.sortable !== undefined ? column.sortable : props.sortable,
    order: column.order ?? index,
  }));
}

function mergeColumns(columns) {
  const normalized = normalizeColumns(columns);
  if (!props.autoSave) return normalized;

  const savedConfig = loadColumnConfig();
  if (!savedConfig?.length) return normalized;

  const savedMap = new Map(savedConfig.map((column) => [column.prop, column]));
  let maxOrder = Math.max(
    0,
    ...savedConfig.map((column) => Number(column.order) || 0)
  );

  return normalized
    .map((column) => {
      const saved = savedMap.get(column.prop);
      if (saved) {
        return {
          ...column,
          hide: !!saved.hide,
          order: saved.order ?? column.order,
          sortable:
            column.sortable !== undefined
              ? column.sortable
              : (saved.sortable ?? props.sortable),
        };
      }

      maxOrder += 1;
      return { ...column, order: maxOrder };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

watch(
  () => props.columns,
  (columns) => {
    initialColumns.value = JSON.parse(JSON.stringify(columns || []));
    filterColumns.value = mergeColumns(columns || []);
  },
  { deep: true, immediate: true }
);

watch(
  () => props.pageSize,
  (size) => {
    if (size && size !== currentPageSize.value) {
      currentPageSize.value = size;
    }
  }
);

watch(
  visibleColumns,
  () => {
    nextTick(() => tableRef.value?.doLayout());
  },
  { deep: true }
);

function getStorageKey() {
  const key = props.storageKey || route.path.replace(/^\/+/, "");
  return `d_table_columns_${key || "default"}`;
}

function loadColumnConfig() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("加载列配置失败:", error);
    return null;
  }
}

function saveColumnConfig() {
  if (!props.autoSave) return;

  try {
    const columns = [...filterColumns.value]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((column, index) => ({
        prop: column.prop,
        hide: !!column.hide,
        sortable: column.sortable,
        order: index,
      }));
    localStorage.setItem(getStorageKey(), JSON.stringify(columns));
  } catch (error) {
    console.warn("保存列配置失败:", error);
  }
}

function onColumnVisibilityChange(column, visible) {
  column.hide = !visible;
  saveColumnConfig();
  nextTick(() => tableRef.value?.doLayout());
}

function moveColumn(index, delta) {
  const list = [...filterColumns.value];
  const target = index + delta;
  if (target < 0 || target >= list.length) return;

  [list[index], list[target]] = [list[target], list[index]];
  list.forEach((column, columnIndex) => {
    column.order = columnIndex;
  });

  filterColumns.value = list;
  saveColumnConfig();
  nextTick(() => tableRef.value?.doLayout());
}

function resetColumns() {
  filterColumns.value = normalizeColumns(initialColumns.value);
  saveColumnConfig();
  ElMessage.success("已恢复默认列配置");
  nextTick(() => tableRef.value?.doLayout());
}

function getColumnProps(item) {
  const {
    hide,
    order,
    slot,
    onClick,
    formatter,
    sortable,
    showOverflowTooltip,
    ...columnProps
  } = item;

  return {
    ...columnProps,
    align: columnProps.align ?? props.defaultAlign,
    sortable: false,
  };
}

function getSlotName(item) {
  return typeof item.slot === "string" ? item.slot : item.prop;
}

function formatCell(item, row) {
  return item.formatter
    ? item.formatter(row, item, row[item.prop])
    : row[item.prop];
}

function isSortable(item) {
  return !!props.sortable && !!item.sortable;
}

function getColumnAlign(item) {
  return item.align || props.defaultAlign || "left";
}

function alignToFlex(align) {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}

function getSortField(item) {
  return props.sortFieldFormatter
    ? props.sortFieldFormatter(item.prop, item)
    : item.prop;
}

function getSortOrder(item) {
  return sortMap.value[getSortField(item)];
}

function handleManualSort(item) {
  const field = getSortField(item);
  if (!field) return;

  const currentOrder = sortMap.value[field];
  const nextOrder =
    currentOrder === "ascending"
      ? "descending"
      : currentOrder === "descending"
        ? null
        : "ascending";

  const nextMap = { ...sortMap.value };
  if (nextOrder) {
    nextMap[field] = nextOrder;
  } else {
    delete nextMap[field];
  }
  sortMap.value = nextMap;

  currentPage.value = 1;
  emit("sort-change", { ...sortParams.value });
  loadTableData(false);
}

function onSortChange({ prop, order }) {
  if (!prop) return;

  const nextMap = { ...sortMap.value };
  if (order) {
    nextMap[prop] = order;
  } else {
    delete nextMap[prop];
  }
  sortMap.value = nextMap;

  currentPage.value = 1;
  emit("sort-change", { ...sortParams.value });
  loadTableData(false);
}

function getRowIndex(index) {
  return (currentPage.value - 1) * currentPageSize.value + index + 1;
}

function handleSelectionChange(rows) {
  selectedRows.value = rows;
  emit("selection-change", rows);
}

function isRowSelected(row) {
  const key = row?.[props.rowKey];
  return selectedRows.value.some((item) => item?.[props.rowKey] === key);
}

function handleSelect(_selection, row) {
  const index = tableData.value.findIndex(
    (item) => item?.[props.rowKey] === row?.[props.rowKey]
  );
  if (index >= 0) {
    lastClickedIndex.value = index;
  }
}

function handleRowClick(row, column, event) {
  if (!props.rowClickSelect) return;

  // 点击行内按钮、输入框、复选框等交互元素时不触发行选中
  const interactiveSelector =
    "button, a, input, textarea, select, .el-button, .el-checkbox, .el-radio, .el-switch, .el-input, .el-select, .el-table__expand-icon";
  if (event?.target?.closest?.(interactiveSelector)) return;

  const currentIndex = tableData.value.findIndex(
    (item) => item?.[props.rowKey] === row?.[props.rowKey]
  );

  if (props.selection) {
    // Shift 点击：按上一次点击位置批量选中/取消选中
    if (event?.shiftKey && lastClickedIndex.value >= 0 && currentIndex >= 0) {
      const start = Math.min(lastClickedIndex.value, currentIndex);
      const end = Math.max(lastClickedIndex.value, currentIndex);
      const shouldSelect = !isRowSelected(row);

      tableData.value.slice(start, end + 1).forEach((item) => {
        tableRef.value?.toggleRowSelection?.(item, shouldSelect);
      });

      lastClickedIndex.value = currentIndex;
      return;
    }

    tableRef.value?.toggleRowSelection?.(row);
    if (currentIndex >= 0) {
      lastClickedIndex.value = currentIndex;
    }
    return;
  }

  tableRef.value?.setCurrentRow?.(row);
}

async function loadTableData(resetPage = true) {
  if (resetPage) {
    currentPage.value = 1;
  }

  lastClickedIndex.value = -1;
  loading.value = true;

  try {
    const requestParams = {
      size: currentPageSize.value,
      current: currentPage.value,
      ...props.params,
      ...sortParams.value,
    };

    const response = await props.get(requestParams);
    const payload = response?.data ?? response;

    let records = Array.isArray(payload)
      ? payload
      : (payload?.records ??
        payload?.list ??
        payload?.rows ??
        payload?.data ??
        []);

    let responseTotal =
      payload?.total ??
      payload?.count ??
      (Array.isArray(payload) ? payload.length : records.length);

    if (typeof props.filterChartFn === "function") {
      const filtered = props.filterChartFn(payload);
      if (filtered) {
        if (Array.isArray(filtered)) {
          records = filtered;
          responseTotal = filtered.length;
        } else {
          records = filtered.records ?? filtered.list ?? filtered.rows ?? [];
          responseTotal =
            filtered.total ?? filtered.count ?? records.length;
        }
      }
    }

    tableData.value = records;
    total.value = Number(responseTotal) || 0;
    emit("change", records);
    emit("page-change", {
      current: currentPage.value,
      size: currentPageSize.value,
    });
  } catch (error) {
    console.error("加载表格数据失败:", error);
    tableData.value = [];
    total.value = 0;
    emit("change", []);
    ElMessage.error(error?.message || "表格数据加载失败");
  } finally {
    loading.value = false;
    nextTick(calculateHeight);
    scheduleHeightCalculation();
  }
}

function handleSizeChange(size) {
  currentPageSize.value = size;
  currentPage.value = 1;
  loadTableData(false);
}

function handleCurrentChange(page) {
  currentPage.value = page;
  loadTableData(false);
}

function clearTable() {
  tableData.value = [];
  total.value = 0;
  currentPage.value = 1;
  selectedRows.value = [];
  lastClickedIndex.value = -1;
  sortMap.value = {};

  tableRef.value?.clearSelection?.();
  emit("change", []);
  emit("selection-change", []);
}

function setCurrentRow(row) {
  tableRef.value?.setCurrentRow?.(row);
}

function handleClearSelection() {
  tableRef.value?.clearSelection?.();
}

function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let heightTimer = null;

function calculateHeight() {
  if (!props.autoHeight) {
    tableHeight.value = attrs.height ?? "auto";
    nextTick(() => tableRef.value?.doLayout());
    return;
  }

  const tableEl = tableRef.value?.$el;
  if (!tableEl) return;

  const { top } = tableEl.getBoundingClientRect();
  const footerHeight = props.showPagination ? 56 : 0;
  const available =
    window.innerHeight -
    Math.ceil(top) -
    footerHeight -
    28 -
    props.heightBuffer;

  tableHeight.value = Math.max(available, 200);
  nextTick(() => tableRef.value?.doLayout());
}

function scheduleHeightCalculation(delay = 300) {
  if (heightTimer) clearTimeout(heightTimer);
  heightTimer = setTimeout(() => {
    heightTimer = null;
    calculateHeight();
  }, delay);
}

const debouncedCalculateHeight = debounce(calculateHeight, 200);
const debouncedQueryboxResize = debounce(resizeTable, 80);

onMounted(() => {
  nextTick(() => {
    calculateHeight();
    scheduleHeightCalculation();
    window.addEventListener("resize", debouncedCalculateHeight);
    window.addEventListener(QUERYBOX_RESIZE_EVENT, debouncedQueryboxResize);
    if (props.immediate) {
      loadTableData();
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", debouncedCalculateHeight);
  window.removeEventListener(QUERYBOX_RESIZE_EVENT, debouncedQueryboxResize);
  if (heightTimer) clearTimeout(heightTimer);
});

function resizeTable() {
  nextTick(calculateHeight);
}

defineExpose({
  loadTableData,
  reload: () => loadTableData(false),
  clearTable,
  setCurrentRow,
  clearSelection: handleClearSelection,
  resize: resizeTable,
  resetColumns,
  getTableRef: () => tableRef.value,
  getSelectedRows: () => selectedRows.value,
});
</script>

<style lang="scss" scoped>
.d-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.d-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  flex-wrap: wrap;
}

.d-table__header-left,
.d-table__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.d-table__header-right {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.d-table__body {
  position: relative;
  min-width: 0;
}

.d-table__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 2px;
}

.d-table__footer.is-split {
  justify-content: space-between;
}

.d-table__footer-left {
  min-width: 0;
}

.d-table.is-row-clickable {
  :deep(.el-table__body tr) {
    cursor: pointer;
  }
}

.d-table__sort-header {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

/* 居中列：左侧补一个与排序图标等宽的占位，保证文字居中且图标紧挨文字 */
.d-table__sort-header.is-center {
  &::before {
    width: 10px;
    flex: 0 0 10px;
    content: "";
  }

  .d-table__sort-carets {
    width: 10px;
    flex: 0 0 10px;
  }
}

.d-table__sort-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.d-table__sort-carets {
  display: inline-flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  line-height: 1;

  .el-icon {
    height: 8px;
    color: var(--el-text-color-placeholder);
    font-size: 10px;
    transition: color 0.15s ease;
  }

  .el-icon.active {
    color: var(--el-color-primary);
  }
}

.d-table__clickable {
  color: var(--el-color-primary);
  cursor: pointer;
}

.d-table-column-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--app-text);
  font-weight: 600;
}

.d-table-column-panel__list {
  max-height: 320px;
  overflow: auto;
}

.d-table-column-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--app-border);

  &:last-child {
    border-bottom: 0;
  }

  :deep(.el-checkbox) {
    flex: 1;
    min-width: 0;
    margin-right: 0;
  }
}

.d-table-column-panel__actions {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
}

:deep(.el-table) {
  --el-table-border-color: var(--app-border);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-header-text-color: var(--app-text);
  --el-table-text-color: var(--app-text-secondary);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);

  border-radius: 6px;
  overflow: hidden;

  th.el-table__cell {
    font-weight: 600;
  }

  .el-table__cell {
    padding: 9px 0;
    vertical-align: middle;
  }

  .caret-wrapper {
    display: none;
  }
}

:deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
