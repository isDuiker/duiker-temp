# d-query-select

查询选择组件，支持下拉框、单选按钮组、多选按钮组、虚拟滚动、远程搜索和参数联动。

## 文件结构

```text
d-query-select/
├── index.vue                        # 主组件，注册名 d-query-select
├── d-virtual-select-options.vue     # 内部虚拟列表，仅供主组件使用
└── d-virtual-select-option-item.vue # 内部虚拟选项，仅供主组件使用
```

`DComponent/index.js` 会自动注册组件，页面中直接使用：

```vue
<d-query-select v-model="value" :option-list="options" />
```

---

## 基础用法

### 1. 直接传入选项

```vue
<template>
  <d-query-select
    v-model="form.status"
    :option-list="statusOptions"
    placeholder="请选择状态"
  />
</template>

<script setup>
import { reactive } from "vue";

const statusOptions = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];

const form = reactive({
  status: "",
});
</script>
```

### 2. 通过接口获取选项

```vue
<template>
  <d-query-select
    v-model="form.userId"
    :get="getUserOptions"
    :params="{ departmentId: form.departmentId }"
    :required-params="['departmentId']"
    :prop="{ label: 'userName', value: 'userId' }"
    placeholder="请选择用户"
  />
</template>

<script setup>
import { reactive } from "vue";
import request from "@/utils/request";

const form = reactive({
  departmentId: "",
  userId: "",
});

async function getUserOptions(params) {
  return request.get("/users/options", { params });
}
</script>
```

`get` 需要返回 Promise，可以直接返回数组，也可以返回带包装的数据：

```js
// 直接返回数组
return [{ label: "张三", value: "1" }];

// 统一响应结构
return {
  code: 200,
  data: [{ label: "张三", value: "1" }],
};
```

组件会自动识别以下数据格式：

```text
[]
{ data: [] }
{ records: [] }
{ list: [] }
{ data: { data: [] } }
{ data: { records: [] } }
{ data: { list: [] } }
```

如果后端格式比较特殊，可以使用 `filter-fn` 自行提取：

```vue
<d-query-select
  v-model="form.value"
  :get="getOptions"
  :filter-fn="(res) => res?.data?.rows ?? []"
/>
```

### 3. 参数联动

```vue
<d-query-select
  v-model="query.monitorId"
  :get="getMonitorNameList"
  :params="{
    projectId: query.projectId,
    monitorType: 1,
  }"
  :required-params="['projectId']"
  :prop="{ label: 'monitorName', value: 'monitorId' }"
  placeholder="请选择监测点"
/>
```

- 监听 `params` 变化，参数变化后重新请求
- `required-params` 中的参数没有全部提供时，不会发起请求
- 等必填参数齐全后自动重新请求

### 4. 多选下拉

```vue
<d-query-select
  v-model="form.ids"
  :option-list="options"
  multiple
  placeholder="请选择"
/>
```

```js
const form = reactive({
  ids: [],
});
```

`multiple` 会透传给内部的 `el-select`。

### 5. 单选 / 多选按钮组

```vue
<d-query-select
  v-model="form.type"
  :option-list="typeOptions"
  type="radio"
/>

<d-query-select
  v-model="form.types"
  :option-list="typeOptions"
  type="checkbox"
/>
```

`type` 可选值：

```text
select   下拉框（默认）
radio    单选按钮组
checkbox 多选按钮组
```

按钮组支持默认插槽，用于追加自定义按钮：

```vue
<d-query-select v-model="form.type" :option-list="typeOptions" type="radio">
  <el-radio-button value="custom">自定义</el-radio-button>
</d-query-select>
```

### 6. 虚拟滚动

选项数量较多（几百、几千条）时使用虚拟滚动：

```vue
<d-query-select
  v-model="form.deviceId"
  :option-list="deviceOptions"
  use-virtual
  placeholder="请选择设备"
/>
```

虚拟列表只渲染可视区域内的选项，避免数据量大时卡顿。

- 默认每项高度为 `34px`
- 如果修改了选项高度，需要同步设置 `virtual-item-size`
- 虚拟模式下输入内容会按 `label` 本地过滤
- 已选中的选项会额外保留隐藏节点，避免回显时只显示 value

### 7. 远程搜索

```vue
<d-query-select
  v-model="form.materialCode"
  :get="getSelectList"
  :params="{ type: '7' }"
  :required-params="['type']"
  :prop="{ label: 'value', value: 'code' }"
  use-virtual
  remote-search
  remote-param-key="value"
  placeholder="输入物料名称/代码搜索"
/>
```

- 输入关键字后才会发起远程请求
- 关键字默认通过 `value` 字段传给接口，可用 `remote-param-key` 修改
- 清空输入框会清空当前选项列表
- 初始已选值不为空时，会带该值请求一次，保证回显正常

---

## API

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `v-model` / `modelValue` | `String \| Number \| Array` | `""` | 绑定值，多选时使用数组 |
| `type` | `String` | `"select"` | `select` / `radio` / `checkbox` |
| `get` | `Function` | `undefined` | 获取选项的方法，需返回 Promise |
| `params` | `Object \| Number` | `{}` | 请求参数，变化时会重新请求 |
| `required-params` | `Array` | `[]` | 必填参数，未全部提供时不发起请求 |
| `prop` | `Object` | `{ label: "label", value: "value" }` | 选项字段映射 |
| `option-list` | `Array` | `[]` | 直接传入的选项，存在时优先于 `get` |
| `filter-fn` | `Function` | `undefined` | 自定义数据提取方法，返回选项数组 |
| `clearable` | `Boolean` | `true` | 是否可清空 |
| `use-virtual` | `Boolean` | `false` | 是否启用虚拟滚动 |
| `virtual-item-size` | `Number` | `34` | 虚拟列表每项预估高度 |
| `remote-search` | `Boolean` | `false` | 是否启用远程搜索 |
| `remote-param-key` | `String` | `"value"` | 远程搜索关键字对应的参数名 |

其他未声明的属性（如 `placeholder`、`multiple`、`disabled`、`style`、`class`）会透传给内部的 `el-select` 或按钮组。

### Events

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `value` | 绑定值更新 |
| `change` | `(value, selectedItem)` | 选择变化。单选时 `selectedItem` 为对象，多选时为数组 |
| `done` | `list` | 选项加载完成 |

```vue
<d-query-select
  v-model="form.userId"
  :get="getUserOptions"
  @change="handleChange"
  @done="handleDone"
/>
```

```js
function handleChange(value, item) {
  console.log("当前值：", value);
  console.log("当前选项：", item);
}

function handleDone(list) {
  console.log("选项加载完成：", list);
}
```

### 暴露的方法

| 方法 / 属性 | 说明 |
| --- | --- |
| `selectRef` | 内部 `el-select` 实例 |
| `list` | 当前选项列表 |
| `getList(query)` | 手动重新加载选项，可传入远程搜索关键字 |

```vue
<d-query-select ref="querySelectRef" v-model="value" :get="getOptions" />
```

```js
const querySelectRef = ref(null);

// 手动刷新
querySelectRef.value?.getList();

// 远程搜索模式下带关键字刷新
querySelectRef.value?.getList("设备");
```

### Slots

| 插槽 | 说明 |
| --- | --- |
| `default` | 仅 `type="radio"` / `type="checkbox"` 时生效，用于追加自定义按钮 |

---

## 使用注意

1. `option-list` 有数据时会优先使用，不再调用 `get`。
2. 多选下拉的 `v-model` 必须初始化为数组，例如 `ids: []`。
3. 远程搜索只在输入关键字后请求，初始没有关键字时列表为空。
4. 虚拟滚动默认按 `34px` 估算每项高度；如果自定义了选项高度，需要同步修改 `virtual-item-size`。
5. 组件外层宽度默认为 `100%`。在行内查询区需要固定宽度时，可以直接传 `style`：

```vue
<d-query-select
  v-model="query.status"
  :option-list="statusOptions"
  style="width: 200px"
/>
```

6. `get` 请求异常时组件会输出错误日志，并保留当前已有的选项列表。
7. `d-virtual-select-options.vue` 和 `d-virtual-select-option-item.vue` 是内部实现，不建议在业务页面直接使用。
