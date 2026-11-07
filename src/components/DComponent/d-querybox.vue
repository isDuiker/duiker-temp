<template>
  <div
    class="d-querybox"
    @keydown.capture="handleGlobalKeydown"
    @paste.capture="handleGlobalPaste"
  >
    <el-form
      ref="queryFormRef"
      v-bind="attrs"
      :model="params"
      :label-width="labelWidth"
      :label-position="labelPosition"
      inline
      @keyup.enter="onSubmit"
      @submit.prevent
    >
      <div class="search-form">
        <div
          class="item_area"
          :class="{ expand: showExpandToggle && collapsed }"
          :style="itemAreaStyle"
        >
          <div ref="contentWrapper" class="query-content-wrapper">
            <SlotClearableWrapper>
              <slot />
            </SlotClearableWrapper>
          </div>

          <div
            v-if="showExpandToggle"
            class="icon_style"
            :style="{ height: `${collapsedHeight}px` }"
            @click="toggle"
          >
            <el-icon :size="20">
              <ArrowUp v-if="!collapsed" />
              <ArrowDown v-else />
            </el-icon>
          </div>
        </div>

        <el-form-item>
          <div class="query-actions">
            <el-button type="primary" @click="onSubmit">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import {
  cloneVNode,
  computed,
  isVNode,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue";
import { ElInput } from "element-plus";

defineOptions({
  name: "d-querybox",
  inheritAttrs: false,
});

const props = defineProps({
  params: {
    type: Object,
    required: true,
  },
  labelWidth: {
    type: String,
    default: "auto",
  },
  labelPosition: {
    type: String,
    default: "left",
  },
  autoQuery: {
    type: Boolean,
    default: true,
  },
  needExpand: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "reset", "resize"]);
const attrs = useAttrs();

const queryFormRef = ref(null);
const contentWrapper = ref(null);
const collapsed = ref(true);
const canExpand = ref(false);
const collapsedHeight = ref(32);

const showExpandToggle = computed(() => props.needExpand || canExpand.value);
const itemAreaStyle = computed(() =>
  showExpandToggle.value && collapsed.value
    ? { height: `${collapsedHeight.value}px` }
    : undefined
);

let resizeObserver = null;
let lastWrapperHeight = 0;

/**
 * 递归处理插槽 VNode，为未显式设置 clearable 的 el-input 自动注入 clearable。
 * 与 Vue 2 版本保持同样的使用体验。
 */
function normalizeNodes(nodes) {
  if (nodes == null) return [];
  return Array.isArray(nodes) ? nodes : [nodes];
}

function injectClearable(nodes) {
  return normalizeNodes(nodes).map((vnode) => {
    if (!isVNode(vnode)) return vnode;

    if (vnode.type === ElInput) {
      if (vnode.props?.clearable === undefined) {
        return cloneVNode(vnode, { clearable: true });
      }
      return vnode;
    }

    const cloned = cloneVNode(vnode);

    if (Array.isArray(vnode.children)) {
      cloned.children = injectClearable(vnode.children);
    } else if (vnode.children && typeof vnode.children === "object") {
      const children = { ...vnode.children };
      Object.keys(children).forEach((key) => {
        const slot = children[key];
        if (typeof slot === "function") {
          children[key] = (...args) => injectClearable(slot(...args));
        }
      });
      cloned.children = children;
    }

    return cloned;
  });
}

const SlotClearableWrapper = {
  name: "SlotClearableWrapper",
  setup(_, { slots }) {
    return () => injectClearable(slots.default?.() ?? []);
  },
};

function checkNeedExpand() {
  nextTick(() => {
    const wrapper = contentWrapper.value;
    if (!wrapper) return;

    const height = wrapper.offsetHeight;
    const firstItem = wrapper.querySelector(".el-form-item");
    const firstItemHeight = firstItem?.offsetHeight || 32;
    if (firstItem) {
      collapsedHeight.value = firstItemHeight;
    }

    if (height !== lastWrapperHeight) {
      lastWrapperHeight = height;
      if (height > 0) emit("resize");
    }

    // 超过一行（第一行高度 + 行间距）时显示展开按钮
    canExpand.value = height > firstItemHeight + 8;
  });
}

function toggle() {
  collapsed.value = !collapsed.value;
  emit("resize");
}

function handleGlobalKeydown(event) {
  const target = event.target;
  if (target?.tagName !== "INPUT") return;
  if (event.key !== " " && event.code !== "Space") return;

  try {
    const { selectionStart, value } = target;
    // 拦截首尾空格
    if (selectionStart === 0 || selectionStart === value.length) {
      event.preventDefault();
    }
  } catch {
    // 部分 input type（如 number）不支持 selectionStart，默认放行
  }
}

function handleGlobalPaste(event) {
  const target = event.target;
  if (target?.tagName !== "INPUT") return;

  const clipboardData = event.clipboardData || window.clipboardData;
  const pastedText = clipboardData?.getData("text");
  if (!pastedText) return;

  const trimmedText = pastedText.trim();
  if (trimmedText === pastedText) return;

  event.preventDefault();

  try {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.setRangeText(trimmedText, start, end, "end");
    target.dispatchEvent(new Event("input", { bubbles: true }));
  } catch {
    document.execCommand("insertText", false, trimmedText);
  }
}

function onSubmit() {
  emit("submit");
}

function onReset() {
  emit("reset");
}

watch(
  () => props.params,
  () => {
    if (props.autoQuery) {
      emit("submit");
    }
  },
  { deep: true }
);

onMounted(() => {
  if (props.needExpand) {
    canExpand.value = true;
    return;
  }

  checkNeedExpand();
  window.addEventListener("resize", checkNeedExpand);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      checkNeedExpand();
    });
    if (contentWrapper.value) {
      resizeObserver.observe(contentWrapper.value);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkNeedExpand);
  resizeObserver?.disconnect();
});

defineExpose({
  resetFields: () => queryFormRef.value?.resetFields?.(),
  clearValidate: () => queryFormRef.value?.clearValidate?.(),
  getFormRef: () => queryFormRef.value,
});
</script>

<style lang="scss" scoped>
.d-querybox {
  background: var(--app-surface);
  border-radius: 4px;
}

.search-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 8px 30px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--app-border);
}

.item_area {
  position: relative;
  flex: 1;
  padding-right: 50px;
}

.item_area.expand {
  overflow: hidden;
}

.query-content-wrapper {
  width: 100%;
}

.icon_style {
  position: absolute;
  top: 0;
  right: 20px;
  display: flex;
  align-items: center;
  color: var(--el-color-primary);
  cursor: pointer;
}

.query-actions {
  width: 135px;
  text-align: right;
  white-space: nowrap;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 30px;
}

/* label-width 为 auto 时，Element Plus 会按最长标签补齐间距，这里改为紧凑间距 */
:deep(.el-form-item__label-wrap) {
  margin-right: 0 !important;
}

:deep(.el-form-item__label) {
  padding-right: 8px;
}

:deep(.search-form .el-form-item) {
  margin-bottom: 8px;
}

/* 查询项之间保留纵向间距，最后一项不保留，避免下方多余留白 */
:deep(.query-content-wrapper > .el-form-item) {
  margin-bottom: 8px;
}

:deep(.query-content-wrapper > .el-form-item:last-child) {
  margin-bottom: 0;
}

/* 操作按钮所在表单项参与行内垂直居中，不保留底部外边距 */
:deep(.search-form > .el-form-item) {
  margin-bottom: 0;
}

:deep(.el-input--small .el-input__inner) {
  width: 200px;
}

:deep(.el-date-editor.el-input) {
  width: 200px;
}
</style>
