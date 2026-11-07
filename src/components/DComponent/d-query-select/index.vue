<template>
  <div class="d-query-select">
    <el-select
      v-if="type === 'select'"
      ref="selectRef"
      v-model="innerValue"
      v-bind="attrs"
      filterable
      :clearable="clearable"
      :filter-method="useVirtual || remoteSearch ? handleFilter : undefined"
      @change="handleInput"
      @visible-change="handleVisibleChange"
    >
      <!-- 虚拟列表模式 -->
      <template v-if="useVirtual">
        <!-- 额外渲染已选中的 option，解决虚拟列表模式下已选项不在可视区域时 Label 不显示的问题 -->
        <el-option
          v-for="item in selectedOptions"
          :key="'selected-' + item[prop.value]"
          :label="item[prop.label]"
          :value="item[prop.value]"
          style="display: none"
        />
        <d-virtual-select-options
          :key="virtualRenderKey"
          :options="filteredList"
          :value-key="prop.value"
          :label-key="prop.label"
          :estimate-size="virtualItemSize"
        />
      </template>

      <!-- 普通模式 -->
      <template v-else>
        <el-option
          v-for="item in list"
          :key="item[prop.value]"
          :label="item[prop.label]"
          :value="item[prop.value]"
        />
      </template>
    </el-select>

    <!-- 单选按钮组 -->
    <el-radio-group
      v-if="type === 'radio'"
      v-model="innerValue"
      v-bind="attrs"
      @change="handleInput"
    >
      <slot />
      <el-radio-button
        v-for="item in list"
        :key="item[prop.value]"
        :value="item[prop.value]"
      >
        {{ item[prop.label] }}
      </el-radio-button>
    </el-radio-group>

    <!-- 多选按钮组 -->
    <el-checkbox-group
      v-if="type === 'checkbox'"
      v-model="innerValue"
      v-bind="attrs"
      @change="handleInput"
    >
      <slot />
      <el-checkbox-button
        v-for="item in list"
        :key="item[prop.value]"
        :value="item[prop.value]"
      >
        {{ item[prop.label] }}
      </el-checkbox-button>
    </el-checkbox-group>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import DVirtualSelectOptions from "./d-virtual-select-options.vue";

defineOptions({
  name: "d-query-select",
  inheritAttrs: false,
});

const props = defineProps({
  // v-model 绑定值
  modelValue: {
    type: [String, Number, Array],
    default: "",
  },
  type: {
    type: String,
    default: "select", // select 下拉框 / checkbox 多选按钮组 / radio 单选按钮组
  },
  // 获取选项的方法，需返回 Promise
  get: {
    type: Function,
    default: undefined,
  },
  // 请求参数
  params: {
    type: [Object, Number],
    default: () => ({}),
  },
  // 必填参数，未全部提供时不会发起请求
  requiredParams: {
    type: Array,
    default: () => [],
  },
  // 选项字段映射
  prop: {
    type: Object,
    default: () => ({
      label: "label",
      value: "value",
    }),
  },
  // 直接传入的选项列表，传入后不会再调用 get
  optionList: {
    type: Array,
    default: () => [],
  },
  // 自定义数据提取方法
  filterFn: {
    type: Function,
    default: undefined,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  // 是否启用虚拟列表
  useVirtual: {
    type: Boolean,
    default: false,
  },
  // 虚拟列表每项预估高度
  virtualItemSize: {
    type: Number,
    default: 34,
  },
  // 是否远程搜索
  remoteSearch: {
    type: Boolean,
    default: false,
  },
  // 远程搜索时传给接口的关键字字段名
  remoteParamKey: {
    type: String,
    default: "value",
  },
});

const emit = defineEmits(["update:modelValue", "change", "done"]);
const attrs = useAttrs();
const selectRef = ref(null);
const list = ref([]);
const searchQuery = ref("");
const virtualRenderKey = ref(0);

const innerValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});

// 已选中的项，用于虚拟列表模式下正确回显 Label
const selectedOptions = computed(() => {
  const value = props.modelValue;

  if (value === null || value === undefined || value === "") {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return list.value.filter((item) =>
    values.includes(item[props.prop.value]),
  );
});

// 必填参数是否齐全
const checkParams = computed(() =>
  props.requiredParams.every((key) => Boolean(props.params?.[key])),
);

// 虚拟列表使用的过滤后数据
const filteredList = computed(() => {
  if (!props.useVirtual || !searchQuery.value || props.remoteSearch) {
    return list.value;
  }

  const keyword = searchQuery.value.toLowerCase();

  return list.value.filter((item) =>
    String(item[props.prop.label] ?? "")
      .toLowerCase()
      .includes(keyword),
  );
});

function bumpRenderKey() {
  if (props.useVirtual) {
    virtualRenderKey.value += 1;
  }
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.list)) return response.list;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.list)) return response.data.list;
  return [];
}

// 获取列表数据
async function getList(query = "") {
  if (props.optionList?.length) {
    list.value = props.optionList;
    bumpRenderKey();
    emit("done", list.value);
    return;
  }

  if (!props.get) return;

  const requestParams = props.remoteSearch
    ? {
        ...(typeof props.params === "object" ? props.params : {}),
        [props.remoteParamKey]: query,
      }
    : props.params;

  try {
    const response = await props.get(requestParams);
    const result = props.filterFn
      ? props.filterFn(response)
      : extractList(response);

    list.value = Array.isArray(result) ? result : extractList(result);
    bumpRenderKey();
    emit("done", list.value);
  } catch (error) {
    console.error("[d-query-select] 获取选项失败:", error);
  }
}

// 处理选择事件
function handleInput(value) {
  const selectedItem = Array.isArray(value)
    ? list.value.filter((item) =>
        value.includes(item[props.prop.value]),
      )
    : list.value.find((item) => item[props.prop.value] === value);

  emit("change", value, selectedItem);
}

// 自定义搜索过滤（虚拟列表模式）
function handleFilter(query) {
  searchQuery.value = query;

  if (!props.remoteSearch) return;

  if (!checkParams.value) {
    list.value = [];
    return;
  }

  if (!query) {
    list.value = [];
    return;
  }

  getList(query);
}

// 下拉框展开或收起时重置搜索关键词
function handleVisibleChange(visible) {
  if (visible && props.useVirtual) {
    searchQuery.value = "";
    bumpRenderKey();
  }
}

// 监听参数变化
watch(
  () => props.params,
  (value, oldValue) => {
    if (JSON.stringify(value) === JSON.stringify(oldValue)) {
      return;
    }

    if (props.remoteSearch) {
      if (!checkParams.value) {
        list.value = [];
        return;
      }

      const query =
        searchQuery.value ||
        (props.modelValue !== null &&
        props.modelValue !== undefined &&
        props.modelValue !== ""
          ? String(props.modelValue)
          : "");

      if (!query) {
        list.value = [];
        return;
      }

      getList(query);
      return;
    }

    if (props.requiredParams.length) {
      if (checkParams.value) {
        getList();
      }
    } else {
      getList();
    }
  },
  { deep: true },
);

onMounted(() => {
  if (props.remoteSearch) {
    if (!checkParams.value) return;

    if (
      props.modelValue !== null &&
      props.modelValue !== undefined &&
      props.modelValue !== ""
    ) {
      getList(String(props.modelValue));
    }
    return;
  }

  if (props.requiredParams.length) {
    if (checkParams.value) {
      getList();
    }
  } else {
    getList();
  }
});

defineExpose({
  selectRef,
  list,
  getList,
});
</script>

<style scoped lang="scss">
.d-query-select {
  width: 100%;
  min-width: 0;

  :deep(.el-select) {
    width: 100%;
  }
}
</style>
