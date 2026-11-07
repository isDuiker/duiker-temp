import request from "@/utils/request";

/**
 * 获取图表示例汇总数据
 * @param {Object} params 查询参数，包含 name、category、startDate、endDate
 */
export function getChartOverview(params) {
  return request.get("/charts/overview", { params });
}
