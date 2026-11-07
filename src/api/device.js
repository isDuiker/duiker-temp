import request from "@/utils/request";

/**
 * 分页查询设备列表
 * @param {Object} params 查询参数，包含 current、size、name、code、status、owner、date、remark、ascs、descs
 */
export function getDeviceList(params) {
  return request.get("/devices", { params });
}

/**
 * 新增设备
 * @param {Object} data 设备信息
 */
export function createDevice(data) {
  return request.post("/devices", data);
}

/**
 * 删除单个设备
 * @param {string|number} id 设备 ID
 */
export function deleteDevice(id) {
  return request.delete(`/devices/${id}`);
}

/**
 * 批量删除设备
 * @param {Array<string|number>} ids 设备 ID 数组
 */
export function deleteDevices(ids) {
  return request.post("/devices/batch-delete", { ids });
}
