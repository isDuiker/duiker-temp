<template>
  <div class="chart-page">
    <d-querybox
      :params="query"
      :auto-query="false"
      @submit="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="名称">
        <el-input v-model="query.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="分类">
        <d-query-select
          v-model="query.category"
          :option-list="categoryOptions"
          placeholder="请选择分类"
        />
      </el-form-item>
      <el-form-item label="日期范围">
        <d-datetime-select
          v-model:startDate="query.startDate"
          v-model:endDate="query.endDate"
          width="320px"
        />
      </el-form-item>
    </d-querybox>

    <div class="grid-charts">
      <d-chart-box title="基础环形图" border>
        <d-chart :options="usageOptions" />
      </d-chart-box>

      <d-chart-box title="基础饼图" border>
        <d-chart :options="gradeOptions" />
      </d-chart-box>

      <d-chart-box title="多分类饼图" border>
        <d-chart :options="originOptions" />
      </d-chart-box>

      <d-chart-box title="占比环形图" border>
        <d-chart :options="typeOptions" />
      </d-chart-box>

      <d-chart-box title="基础柱状图" border>
        <d-chart :options="yearOptions" />
      </d-chart-box>

      <d-chart-box title="面积折线图" border>
        <template #search>
          <d-datetime-select
            v-model:startDate="trendRange.start"
            v-model:endDate="trendRange.end"
            type="monthrange"
            format="YYYY-MM"
            width="240px"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :clearable="false"
          />
        </template>
        <d-chart :options="trendOptions" />
      </d-chart-box>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue";
import { ElMessage } from "element-plus";

const createQuery = () => ({
  name: "",
  category: "",
  startDate: "",
  endDate: "",
});

const query = reactive(createQuery());

const categoryOptions = [
  { label: "类别A", value: "A" },
  { label: "类别B", value: "B" },
  { label: "类别C", value: "C" },
  { label: "类别D", value: "D" },
];

// 示例页面暂无接口，实际项目可在查询后调用接口刷新图表数据
function handleSearch() {
  ElMessage.success("查询完成");
}

function handleReset() {
  Object.assign(query, createQuery());
}

const CHART_COLORS = [
  "#5470c6",
  "#2ec7c9",
  "#5ad8a6",
  "#f6bd16",
  "#ee6666",
  "#73c0de",
  "#f5a623",
  "#9a60b4",
];

const AXIS_LABEL = {
  color: "#909399",
  fontSize: 12,
};

const SPLIT_LINE = {
  lineStyle: {
    color: "#ebeef5",
  },
};

// 基础环形图
const usageOptions = {
  color: ["#5470c6", "#a9bdf0"],
  tooltip: {
    trigger: "item",
    formatter: "{b}：{c} 个（{d}%）",
  },
  title: {
    text: "880",
    subtext: "总数量",
    left: "center",
    top: "32%",
    textStyle: {
      color: "#303133",
      fontSize: 28,
      fontWeight: 600,
    },
    subtextStyle: {
      color: "#909399",
      fontSize: 13,
    },
  },
  legend: {
    bottom: 0,
    left: "center",
    icon: "circle",
    itemGap: 20,
  },
  series: [
    {
      type: "pie",
      center: ["50%", "42%"],
      radius: ["48%", "65%"],
      startAngle: 135,
      avoidLabelOverlap: true,
      label: {
        color: "#606266",
        lineHeight: 18,
        formatter: "{b}\n{c}",
      },
      labelLine: {
        length: 12,
        length2: 8,
      },
      data: [
        { name: "已使用", value: 341 },
        { name: "未使用", value: 539 },
      ],
    },
  ],
};

// 基础饼图
const gradeOptions = {
  color: ["#5470c6", "#2ec7c9", "#ee6666", "#f5a623", "#f6bd16"],
  tooltip: {
    trigger: "item",
    formatter: "{b}：{c} 个（{d}%）",
  },
  series: [
    {
      name: "基础饼图",
      type: "pie",
      radius: "62%",
      center: ["50%", "52%"],
      avoidLabelOverlap: true,
      label: {
        color: "#606266",
        lineHeight: 18,
        formatter: "{b}\n{c}个",
      },
      labelLine: {
        length: 12,
        length2: 10,
      },
      data: [
        { name: "类别A", value: 848 },
        { name: "类别B", value: 835 },
        { name: "类别C", value: 265 },
        { name: "类别D", value: 484 },
        { name: "类别E", value: 352 },
      ],
    },
  ],
};

// 多分类饼图
const originOptions = {
  color: CHART_COLORS,
  tooltip: {
    trigger: "item",
    formatter: "{b}：{c} 个（{d}%）",
  },
  series: [
    {
      name: "多分类饼图",
      type: "pie",
      radius: "62%",
      center: ["50%", "52%"],
      avoidLabelOverlap: true,
      label: {
        color: "#606266",
        lineHeight: 18,
        formatter: "{b}\n{c}个",
      },
      labelLine: {
        length: 12,
        length2: 10,
      },
      data: [
        { name: "类别A", value: 4031 },
        { name: "类别B", value: 1247 },
        { name: "类别C", value: 540 },
        { name: "类别D", value: 368 },
        { name: "类别E", value: 284 },
        { name: "类别F", value: 193 },
        { name: "类别G", value: 100 },
        { name: "类别H", value: 80 },
      ],
    },
  ],
};

// 占比环形图
const typeOptions = {
  color: ["#5470c6", "#2ec7c9", "#5ad8a6"],
  tooltip: {
    trigger: "item",
    formatter: "{b}：{c} 个（{d}%）",
  },
  title: {
    text: "42%",
    subtext: "类别A",
    left: "center",
    top: "32%",
    textStyle: {
      color: "#303133",
      fontSize: 30,
      fontWeight: 600,
    },
    subtextStyle: {
      color: "#606266",
      fontSize: 13,
    },
  },
  legend: {
    bottom: 0,
    left: "center",
    icon: "circle",
    itemGap: 20,
  },
  series: [
    {
      name: "占比环形图",
      type: "pie",
      radius: ["52%", "68%"],
      center: ["50%", "42%"],
      label: {
        show: false,
      },
      data: [
        { name: "类别A", value: 1538 },
        { name: "类别B", value: 1120 },
        { name: "类别C", value: 1002 },
      ],
    },
  ],
};

// 基础柱状图
const yearOptions = {
  color: ["#5470c6"],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter: "{b}<br/>{a}：{c} 个",
  },
  grid: {
    left: 12,
    right: 16,
    top: 44,
    bottom: 8,
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: ["2020及以前", "2021", "2022", "2023", "2024", "2025"],
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: AXIS_LABEL,
  },
  yAxis: {
    type: "value",
    name: "单位: 个",
    max: 3000,
    interval: 500,
    nameLocation: "end",
    nameGap: 15,
    nameTextStyle: {
      color: "#909399",
      fontSize: 12,
      align: "left",
    },
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: AXIS_LABEL,
    splitLine: SPLIT_LINE,
  },
  series: [
    {
      name: "数量",
      type: "bar",
      barWidth: 22,
      label: {
        show: true,
        position: "top",
        color: "#606266",
        fontSize: 12,
      },
      data: [483, 842, 1766, 1620, 2800, 1200],
    },
  ],
};

const TREND_DATA = [
  { month: "2025-01", value: 8700 },
  { month: "2025-02", value: 8950 },
  { month: "2025-03", value: 8600 },
  { month: "2025-04", value: 9800 },
  { month: "2025-05", value: 9600 },
  { month: "2025-06", value: 10050 },
];

const trendRange = reactive({
  start: "",
  end: "",
});

// 面积折线图：根据日期范围过滤数据
const trendOptions = computed(() => {
  const records = TREND_DATA.filter((item) => {
    if (trendRange.start && item.month < trendRange.start) return false;
    if (trendRange.end && item.month > trendRange.end) return false;
    return true;
  });

  return {
    color: ["#5470c6"],
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const item = params[0];
        return `${item.axisValue}<br/>数量：${item.value} 个`;
      },
    },
    grid: {
      left: 12,
      right: 20,
      top: 48,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: records.map((item) => item.month),
      axisLine: {
        lineStyle: {
          color: "#e4e7ed",
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: AXIS_LABEL,
    },
    yAxis: {
      type: "value",
      name: "数量(个)",
      max: 12000,
      interval: 3000,
      nameLocation: "end",
      nameGap: 15,
      nameTextStyle: {
        color: "#909399",
        fontSize: 12,
        align: "left",
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
    },
    series: [
      {
        name: "数量",
        type: "line",
        smooth: false,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: "#5470c6",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(84, 112, 198, 0.35)" },
              { offset: 1, color: "rgba(84, 112, 198, 0.03)" },
            ],
          },
        },
        data: records.map((item) => item.value),
      },
    ],
  };
});
</script>

<style scoped lang="scss">
.grid-charts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  > * {
    height: calc(50vh - 130px);
    min-height: 300px;
  }
}

@media (max-width: 1366px) {
  .grid-charts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .grid-charts {
    grid-template-columns: minmax(0, 1fr);

    > * {
      height: 320px;
      min-height: 0;
    }
  }
}
</style>
