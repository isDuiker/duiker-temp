<script setup>
import { nextTick, onBeforeUnmount, ref, useAttrs, watch } from "vue";

defineOptions({
  name: "d-dialog",
  inheritAttrs: false,
});

const props = defineProps({
  alignCenter: {
    type: Boolean,
    default: true,
  },
  draggable: {
    type: Boolean,
    default: true,
  },
  resizable: {
    type: Boolean,
    default: true,
  },
  minWidth: {
    type: Number,
    default: 320,
  },
  minHeight: {
    type: Number,
    default: 180,
  },
});

const model = defineModel({ type: Boolean, default: false });
const attrs = useAttrs();

const dialogRef = ref(null);
const resizedWidth = ref();
const resizedHeight = ref();

let dialogElement;
let resizeHandles = [];
let removePointerListeners;
let resizeTimer;

const RESIZE_DIRECTIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

function getDialogElement() {
  return (
    dialogRef.value?.dialogContentRef?.$el ||
    dialogRef.value?.$el?.querySelector?.(".el-dialog") ||
    document.querySelector(".el-overlay-dialog .el-dialog")
  );
}

function setupResize() {
  cleanupResize();
  if (!props.resizable) return;

  nextTick(() => {
    dialogElement = getDialogElement();
    if (!dialogElement || !props.resizable) return;

    dialogElement.classList.add("d-dialog--resizable");

    resizeHandles = RESIZE_DIRECTIONS.map((direction) => {
      const handle = document.createElement("div");
      handle.className = `d-dialog__resize-handle d-dialog__resize-handle--${direction}`;
      handle.setAttribute("aria-label", "拖拽调整弹窗大小");
      handle.setAttribute("role", "separator");
      handle.addEventListener("pointerdown", (event) =>
        beginResize(event, direction, handle)
      );
      dialogElement.appendChild(handle);
      return handle;
    });
  });
}

function beginResize(event, direction, handle) {
  if (!dialogElement || event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = dialogElement.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = rect.width;
  const startHeight = rect.height;
  const maxWidth = Math.max(props.minWidth, window.innerWidth - 32);
  const maxHeight = Math.max(props.minHeight, window.innerHeight - 32);
  // 居中弹窗从四角缩放时，宽高变化量为鼠标位移的 2 倍
  const factor = props.alignCenter ? 2 : 1;
  const horizontal = direction.endsWith("right") ? 1 : -1;
  const vertical = direction.startsWith("bottom") ? 1 : -1;

  const resize = (moveEvent) => {
    if (!dialogElement) return;
    const width = Math.min(
      maxWidth,
      Math.max(
        props.minWidth,
        startWidth + horizontal * (moveEvent.clientX - startX) * factor
      )
    );
    const height = Math.min(
      maxHeight,
      Math.max(
        props.minHeight,
        startHeight + vertical * (moveEvent.clientY - startY) * factor
      )
    );

    resizedWidth.value = `${width}px`;
    resizedHeight.value = `${height}px`;
  };

  const stopResize = () => {
    removePointerListeners?.();
    removePointerListeners = undefined;
    dialogRef.value?.resetPosition?.();
  };

  handle.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", resize);
  document.addEventListener("pointerup", stopResize, { once: true });
  document.addEventListener("pointercancel", stopResize, { once: true });
  removePointerListeners = () => {
    document.removeEventListener("pointermove", resize);
    document.removeEventListener("pointerup", stopResize);
    document.removeEventListener("pointercancel", stopResize);
  };
}

function cleanupResize() {
  removePointerListeners?.();
  removePointerListeners = undefined;
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = undefined;
  }
  resizeHandles.forEach((handle) => handle.remove());
  resizeHandles = [];

  if (dialogElement) {
    dialogElement.classList.remove("d-dialog--resizable");
  }

  dialogElement = undefined;
  resizedWidth.value = undefined;
  resizedHeight.value = undefined;
}

watch(model, (open) => {
  if (open) {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = undefined;
      setupResize();
    }, 0);
  } else {
    cleanupResize();
  }
});

onBeforeUnmount(cleanupResize);

defineExpose({
  getDialogRef: () => dialogRef.value,
  resetPosition: () => dialogRef.value?.resetPosition?.(),
});
</script>

<template>
  <el-dialog
    ref="dialogRef"
    v-model="model"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    v-bind="attrs"
    :align-center="props.alignCenter"
    :width="resizedWidth ?? attrs.width"
    :style="
      resizedHeight ? [attrs.style, { height: resizedHeight }] : attrs.style
    "
    :draggable="props.draggable"
    @opened="setupResize"
    @closed="cleanupResize"
  >
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </el-dialog>
</template>

<style lang="scss">
/* 弹窗内容作为可缩放容器时需要纵向 flex 布局，让 body 自适应滚动 */
.d-dialog--resizable {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
}

.d-dialog--resizable > .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* 避免右上角缩放手柄覆盖关闭按钮 */
.d-dialog--resizable > .el-dialog__headerbtn {
  z-index: 3;
}

.d-dialog__resize-handle {
  position: absolute;
  z-index: 1;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  touch-action: none;
}

.d-dialog__resize-handle::after {
  position: absolute;
  width: 8px;
  height: 8px;
  content: "";
}

.d-dialog__resize-handle:hover::after {
  border-color: var(--el-color-primary);
}

.d-dialog__resize-handle--top-left {
  top: 2px;
  left: 2px;
  cursor: nwse-resize;

  &::after {
    top: 3px;
    left: 3px;
    border-top: 2px solid var(--el-border-color-darker, #a8abb2);
    border-left: 2px solid var(--el-border-color-darker, #a8abb2);
  }
}

.d-dialog__resize-handle--top-right {
  top: 2px;
  right: 2px;
  cursor: nesw-resize;

  &::after {
    top: 3px;
    right: 3px;
    border-top: 2px solid var(--el-border-color-darker, #a8abb2);
    border-right: 2px solid var(--el-border-color-darker, #a8abb2);
  }
}

.d-dialog__resize-handle--bottom-left {
  bottom: 2px;
  left: 2px;
  cursor: nesw-resize;

  &::after {
    bottom: 3px;
    left: 3px;
    border-bottom: 2px solid var(--el-border-color-darker, #a8abb2);
    border-left: 2px solid var(--el-border-color-darker, #a8abb2);
  }
}

.d-dialog__resize-handle--bottom-right {
  right: 2px;
  bottom: 2px;
  cursor: nwse-resize;

  &::after {
    right: 3px;
    bottom: 3px;
    border-right: 2px solid var(--el-border-color-darker, #a8abb2);
    border-bottom: 2px solid var(--el-border-color-darker, #a8abb2);
  }
}
</style>
