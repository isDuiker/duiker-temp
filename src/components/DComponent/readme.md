# DComponent 组件库

项目内的通用业务组件集合，基于 Vue 3 + Element Plus 实现，统一以 `d-` 前缀命名，并通过 `index.js` 自动全局注册。

## 目录结构

```text
src/components/DComponent/
├── index.js                         # 组件自动注册 + 布局事件常量
├── readme.md                        # 本文档
├── d-breadcrumb.vue                 # 路由面包屑
├── d-card.vue                       # 内容卡片
├── d-datetime-select.vue            # 日期范围选择
├── d-dialog.vue                     # 可拖拽 / 可缩放弹窗
├── d-export.vue                     # 文件导出按钮
├── d-import.vue                     # Excel 导入弹窗
├── d-querybox.vue                   # 查询条件栏
├── d-table.vue                      # 远程数据表格
└── d-query-select/
    ├── index.vue                    # 查询选择组件
    ├── d-virtual-select-options.vue # 内部虚拟列表
    ├── d-virtual-select-option-item.vue
    └── readme.md                    # 组件详细文档
```

## 自动注册

`src/main.js` 中统一注册：

```js
import { registerDComponents } from "@/components/DComponent";

registerDComponents(app);
```

`index.js` 使用 Vite 的 `import.meta.glob` 扫描所有 `.vue` 文件：

```js
const modules = import.meta.glob("./**/*.vue", { eager: true });
```

注册名优先取组件内部定义的 `name`，所以新增组件时需要写：

```js
defineOptions({
  name: "d-xxx",
});
```

如果没有定义 `name`，会使用文件名自动转成 kebab-case。

### 新增普通组件

```text
DComponent/
└── d-xxx.vue
```

```vue
<script setup>
defineOptions({
  name: "d-xxx",
});
</script>
```

### 新增复合组件

组件内部还需要拆分私有子组件时，使用文件夹 + `index.vue`：

```text
DComponent/d-xxx/
├── index.vue
├── private-a.vue
└── private-b.vue
```

`index.vue` 中定义 `name: "d-xxx"`，私有子组件只在内部通过相对路径引入，不建议在业务页面直接使用。

## 组件列表

| 组件 | 说明 |
| --- | --- |
| `d-breadcrumb` | 根据当前路由自动生成面包屑 |
| `d-card` | 统一风格的内容卡片 |
| `d-querybox` | 查询条件栏，支持自动折叠 / 展开 |
| `d-table` | 配置驱动的远程数据表格 |
| `d-dialog` | 支持拖拽移动、四角缩放的弹窗 |
| `d-import` | Excel 导入弹窗 |
| `d-export` | 文件导出按钮 |
| `d-datetime-select` | 日期范围选择 |
| `d-query-select` | 支持虚拟滚动、远程搜索的下拉选择 |

---

## d-card

统一的内容卡片容器。

```vue
<d-card>
  页面内容
</d-card>
```

| 插槽 | 说明 |
| --- | --- |
| `default` | 卡片内容 |

组件自带主题背景、边框、圆角和阴影，高度默认 `100%`。

---

## d-breadcrumb

根据当前路由的 `route.matched` 和 `meta.title` 自动生成面包屑。

```vue
<d-breadcrumb />
```

无需传参，通常只在布局组件中使用。最后一级不可点击，前面的层级会生成路由链接。

路由需要配置 `meta.title`：

```js
{
  path: "/feature/table",
  name: "feature-table",
  component: () => import("@/views/feature/table/index.vue"),
  meta: { title: "通用页面" },
}
```

---

## d-querybox

查询条件栏，内部使用 `el-form` 的 `inline` 模式。

```vue
<d-querybox
  :params="query"
  :auto-query="false"
  @submit="handleSearch"
  @reset="handleReset"
>
  <el-form-item label="名称">
    <el-input v-model="query.name" placeholder="请输入名称" />
  </el-form-item>

  <el-form-item label="状态">
    <el-select v-model="query.status" placeholder="请选择状态">
      <el-option label="启用" value="enabled" />
      <el-option label="停用" value="disabled" />
    </el-select>
  </el-form-item>
</d-querybox>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `params` | `Object` | 必填 | 查询参数对象 |
| `label-width` | `String` | `"auto"` | 表单标签宽度 |
| `label-position` | `String` | `"left"` | 标签位置 |
| `auto-query` | `Boolean` | `true` | `params` 变化时是否自动触发 `submit` |
| `need-expand` | `Boolean` | `false` | 是否强制显示展开 / 收起按钮 |

### Events

| 事件 | 说明 |
| --- | --- |
| `submit` | 点击查询，或 `auto-query` 为 `true` 时参数变化触发 |
| `reset` | 点击重置 |
| `resize` | 查询区高度变化，内部使用 |

### 暴露方法

```js
queryboxRef.value?.resetFields();
queryboxRef.value?.clearValidate();
queryboxRef.value?.getFormRef();
```

### 其他行为

- 超过一行时自动折叠，并显示展开 / 收起箭头
- 输入框内按回车会触发 `submit`
- 自动为插槽中的 `el-input` 注入 `clearable`
- 自动处理输入内容首尾空格
- 查询项中的输入框、下拉框默认统一为 `200px` 宽，日期组件由自身的 `width` 控制
- 高度变化会派发 `QUERYBOX_RESIZE_EVENT`，`d-table` 会自动监听并重新计算高度

---

## d-table

配置驱动的远程数据表格，内置分页、排序、选择、列设置和自动高度。

```vue
<template>
  <d-table
    ref="tableRef"
    :params="query"
    :get="getDeviceList"
    :columns="columns"
    selection
    storage-key="device-table"
    @selection-change="handleSelectionChange"
  >
    <template #toolbar>
      <el-button type="primary" @click="handleCreate">新增</el-button>
    </template>

    <template #actions="{ row }">
      <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
      <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </d-table>
</template>

<script setup>
import { reactive, ref } from "vue";
import { getDeviceList } from "@/api";

const query = reactive({
  name: "",
  status: "",
});

const columns = [
  { prop: "name", label: "设备名称", minWidth: 120, sortable: "custom" },
  { prop: "code", label: "设备编码", minWidth: 120, sortable: "custom" },
  {
    prop: "status",
    label: "状态",
    minWidth: 110,
    slot: "status",
  },
  {
    prop: "date",
    label: "创建日期",
    width: 120,
    formatter: (row) => row.date || "-",
  },
];
</script>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `params` | `Object` | `{}` | 查询参数 |
| `get` | `Function` | 必填 | 获取表格数据的方法 |
| `columns` | `Array` | `[]` | 列配置 |
| `show-pagination` | `Boolean` | `true` | 是否显示分页 |
| `show-index` | `Boolean` | `true` | 是否显示序号列 |
| `selection` | `Boolean` | `false` | 是否显示多选列 |
| `row-click-select` | `Boolean` | `true` | 点击行是否切换选中 |
| `show-expand` | `Boolean` | `false` | 是否显示展开列 |
| `auto-height` | `Boolean` | `true` | 是否自动计算表格高度 |
| `show-set-col` | `Boolean` | `true` | 是否显示列设置按钮 |
| `height-buffer` | `Number` | `0` | 自动高度额外预留 |
| `filter-chart-fn` | `Function` | `null` | 二次处理接口返回的数据 |
| `sort-field-formatter` | `Function` | `null` | 自定义排序字段名 |
| `storage-key` | `String` | `""` | 列配置持久化 key |
| `auto-save` | `Boolean` | `true` | 是否自动保存列配置 |
| `sortable` | `String \| Boolean` | `"custom"` | 是否启用排序 |
| `row-key` | `String` | `"id"` | 行唯一键 |
| `enable-bottom-slot` | `Boolean` | `false` | 是否启用分页左侧插槽 |
| `default-align` | `String` | `"center"` | 默认列对齐方式 |
| `actions-label` | `String` | `"操作"` | 操作列标题 |
| `actions-width` | `String \| Number` | `140` | 操作列宽度 |
| `actions-align` | `String` | `"center"` | 操作列对齐方式 |
| `actions-fixed` | `Boolean \| String` | `"right"` | 操作列固定位置 |
| `page-size` | `Number` | `50` | 默认每页条数 |
| `page-sizes` | `Array` | `[50, 100, 200, 500]` | 每页条数选项 |
| `pagination-layout` | `String` | 见源码 | 分页布局 |
| `immediate` | `Boolean` | `false` | 是否在挂载后立即请求数据 |

### 列配置

```js
const columns = [
  {
    prop: "name",
    label: "设备名称",
    minWidth: 120,
    sortable: "custom",
    slot: "name",              // 使用 #name="{ row }" 自定义单元格
    formatter: (row, column, value) => value,
    onClick: (row) => {},      // 单元格点击事件
    hide: false,               // 是否隐藏
    align: "center",           // 覆盖默认对齐方式
    showOverflowTooltip: true,
  },
];
```

### Slots

| 插槽 | 参数 | 说明 |
| --- | --- | --- |
| `top-left` | - | 表格左上角内容 |
| `toolbar` | - | 表格右上角工具栏 |
| `top-right` | - | 工具栏右侧追加内容 |
| `expand` | `scope` | 展开行内容 |
| `default` | - | 追加自定义 `el-table-column` |
| 列插槽 | `{ row }` | 由列配置的 `slot` 指定名称 |
| `actions` | `{ row, column, $index }` | 操作列，存在时自动生成并固定右侧 |
| `bottom-left` | - | 分页左侧内容，需要 `enable-bottom-slot` |

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `change` | `records` | 数据加载完成 |
| `page-change` | `{ current, size }` | 页码或每页条数变化 |
| `sort-change` | `{ ascs, descs }` | 排序变化 |
| `selection-change` | `rows` | 选中行变化 |

### 暴露方法

```js
tableRef.value?.reload();          // 保持当前页刷新
tableRef.value?.loadTableData();   // 重新加载
tableRef.value?.clearTable();
tableRef.value?.clearSelection();
tableRef.value?.resize();
tableRef.value?.resetColumns();
tableRef.value?.setCurrentRow(row);
tableRef.value?.getSelectedRows();
tableRef.value?.getTableRef();
```

### 接口返回格式

`get` 会收到：

```js
{
  size,
  current,
  ...params,
  ...sortParams,
}
```

支持以下返回结构：

```js
// 数组
[]

// 对象
{
  records: [],
  total: 100,
}

// 也兼容 list / rows / data 字段
```

### 其他行为

- `#actions` 插槽存在时才生成操作列，默认固定右侧
- 支持点击行选中，按住 `Shift` 可范围选中
- 列的显示状态、顺序和排序状态可通过 `storage-key` 持久化
- 自动高度会监听查询区高度变化，无需手动调用 `resize`
- 排序默认交给后端处理，通过 `ascs` / `descs` 参数传递

---

## d-dialog

支持拖拽移动和四角缩放的弹窗。

```vue
<d-dialog v-model="visible" title="设备信息编辑" width="640px">
  <el-form :model="form" label-width="90px">
    <el-form-item label="设备名称">
      <el-input v-model="form.name" />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="visible = false">取消</el-button>
    <el-button type="primary" @click="handleConfirm">确定</el-button>
  </template>
</d-dialog>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `v-model` | `Boolean` | `false` | 是否显示 |
| `align-center` | `Boolean` | `true` | 是否垂直居中 |
| `draggable` | `Boolean` | `true` | 是否可拖动 |
| `resizable` | `Boolean` | `true` | 是否可缩放 |
| `min-width` | `Number` | `320` | 最小宽度 |
| `min-height` | `Number` | `180` | 最小高度 |

其余属性（如 `title`、`width`、`append-to-body`）会透传给 `el-dialog`，所有插槽也会透传。

### 暴露方法

```js
dialogRef.value?.getDialogRef();
dialogRef.value?.resetPosition();
```

---

## d-import

Excel 导入弹窗。

```vue
<d-import
  url="/devices/import"
  :params="query"
  accept=".xls,.xlsx"
  @success="handleImportSuccess"
>
  导入
</d-import>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `String` | 必填 | 上传接口地址 |
| `params` | `Object` | `{}` | 额外表单参数，会一起提交 |
| `limit` | `Number` | `1` | 最大上传数量 |
| `accept` | `String` | `".xls,.xlsx"` | 允许的文件类型 |

其他属性会透传给 `el-upload`。

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `success` | `response` | 上传成功 |
| `error` | `error` | 上传失败 |

### 插槽 / 暴露方法

- 默认插槽：按钮内容，默认显示“导入”
- `open()`：打开弹窗
- `close()`：关闭弹窗

---

## d-export

文件导出按钮。

```vue
<d-export
  url="/devices/export"
  :params="query"
  filename="设备列表.xlsx"
  @success="handleExportSuccess"
>
  导出
</d-export>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `String` | 必填 | 导出接口地址 |
| `params` | `Object` | `{}` | 查询参数 |
| `filename` | `String` | `""` | 下载文件名 |

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `success` | - | 导出成功 |
| `error` | `error` | 导出失败 |

默认插槽用于自定义按钮内容，暴露 `export()` 方法可手动触发。

---

## d-datetime-select

日期范围选择，左右面板可独立切换月份，内置常用快捷选项。

```vue
<d-datetime-select
  v-model:startDate="query.startDate"
  v-model:endDate="query.endDate"
  width="320px"
/>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `startDate` | `String` | `""` | 开始日期 |
| `endDate` | `String` | `""` | 结束日期 |
| `type` | `String` | `"daterange"` | 日期类型 |
| `format` | `String` | `"YYYY-MM-DD"` | 显示格式 |
| `valueFormat` | `String` | `""` | 绑定值格式，默认同 `format` |
| `startPlaceholder` | `String` | `"开始时间"` | 开始占位文字 |
| `endPlaceholder` | `String` | `"结束时间"` | 结束占位文字 |
| `rangeSeparator` | `String` | `"至"` | 分隔文字 |
| `historyResearch` | `Boolean` | `false` | 默认展示最近一个月 |
| `width` | `String` | `"380px"` | 组件宽度 |

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:startDate` | `value` | 开始日期变化 |
| `update:endDate` | `value` | 结束日期变化 |
| `change` | `{ startDate, endDate }` | 日期范围变化 |

### 暴露方法

```js
datetimeRef.value?.clearValueRange();
datetimeRef.value?.focus();
datetimeRef.value?.datePickerRef;
```

内置快捷选项：最近一周、最近一个月、最近三个月。

---

## d-query-select

查询选择组件，支持下拉、单选按钮组、多选按钮组、虚拟滚动和远程搜索。

```vue
<d-query-select
  v-model="query.status"
  :option-list="statusOptions"
  placeholder="请选择状态"
/>

<d-query-select
  v-model="query.monitorId"
  :get="getMonitorNameList"
  :params="{ projectId: query.projectId }"
  :required-params="['projectId']"
  :prop="{ label: 'monitorName', value: 'monitorId' }"
  use-virtual
  remote-search
  placeholder="请选择监测点"
/>
```

详细 API、示例和注意事项见：

```text
src/components/DComponent/d-query-select/readme.md
```

---

## 公共说明

- 组件依赖 Element Plus，并复用项目的 `--app-*` 主题变量
- 组件均为 `<script setup>` 写法
- 新增组件统一使用 `d-` 前缀
- `d-query-select` 文件夹中的两个虚拟列表组件为内部实现，业务页面不要直接使用
- `QUERYBOX_RESIZE_EVENT` 从 `index.js` 导出，查询区展开 / 收起时用于通知表格重新计算高度
