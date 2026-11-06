import request from "@/utils/request";

/**
 * 用户接口示例
 *
 * 说明：
 * 1. 所有请求统一使用 @/utils/request，已配置 baseURL、超时、token 和错误处理
 * 2. 开发环境 /api 会被 Vite 代理到后端，并自动去掉 /api 前缀
 * 3. 以下接口地址按实际后端路由修改
 */

/**
 * 获取用户列表
 * @param {Object} params 查询参数，例如 { page: 1, pageSize: 10, keyword: "" }
 * @returns {Promise}
 */
export function getUserList(params) {
  return request.get("/users", { params });
}

/**
 * 获取用户详情
 * @param {string|number} id 用户 ID
 * @returns {Promise}
 */
export function getUserDetail(id) {
  return request.get(`/users/${id}`);
}

/**
 * 新增用户
 * @param {Object} data 用户信息
 * @returns {Promise}
 */
export function createUser(data) {
  return request.post("/users", data);
}

/**
 * 更新用户
 * @param {string|number} id 用户 ID
 * @param {Object} data 用户信息
 * @returns {Promise}
 */
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data);
}

/**
 * 删除用户
 * @param {string|number} id 用户 ID
 * @returns {Promise}
 */
export function deleteUser(id) {
  return request.delete(`/users/${id}`);
}
