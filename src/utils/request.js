import axios from "axios";
import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";

// 接口基础路径，从环境变量读取，未配置时默认使用 /api
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";
// 请求超时时间（毫秒）
const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;
// 本地保存 token 的键名，需与登录逻辑保持一致
const TOKEN_KEY = "token";

// 创建 axios 实例
const request = axios.create({
  baseURL,
  timeout,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // 按后端实际要求修改请求头，例如 Authorization: Bearer xxx
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 文件流等二进制数据直接返回
    if (
      response.config.responseType === "blob" ||
      response.config.responseType === "arraybuffer"
    ) {
      return response.data;
    }

    const res = response.data;

    // 后端未使用统一响应结构（如纯文本、数组、业务对象）时直接返回
    if (!res || typeof res !== "object" || Array.isArray(res)) {
      return res;
    }

    // 只有同时具备数字型 code 和 data/msg/message 字段时，才按统一响应结构处理，
    // 避免业务数据里的 code 字段（例如设备编码为 "1"）被误判为业务状态码。
    const hasBusinessCode =
      Object.prototype.hasOwnProperty.call(res, "code") &&
      (typeof res.code === "number" || /^\d+$/.test(String(res.code))) &&
      (Object.prototype.hasOwnProperty.call(res, "data") ||
        Object.prototype.hasOwnProperty.call(res, "msg") ||
        Object.prototype.hasOwnProperty.call(res, "message"));

    if (!hasBusinessCode) {
      return res;
    }

    const code = Number(res.code);
    // 兼容 code 为 200 或 0 的成功约定
    // if (code === 200 || code === 0) {
    if ((code >= 200 && code < 300) || code === 0) {
      return res.data;
    }

    // 登录失效
    if (code === 401) {
      handleUnauthorized();
      return Promise.reject(new Error(res.msg || res.message || "登录已失效"));
    }

    const message = res.msg || res.message || "请求失败";
    ElMessage.error(message);
    return Promise.reject(new Error(message));
  },
  (error) => {
    let message = "网络异常，请稍后重试";

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      message = "请求超时，请稍后重试";
    } else if (error.response) {
      const { status, data } = error.response;
      const statusMessages = {
        400: "请求参数错误",
        401: "登录已失效，请重新登录",
        403: "没有权限访问该资源",
        404: "请求的资源不存在",
        500: "服务器内部错误",
        502: "网关错误",
        503: "服务暂不可用",
        504: "网关超时",
      };
      message =
        data?.msg ||
        data?.message ||
        statusMessages[status] ||
        `请求失败（${status}）`;

      if (status === 401) {
        handleUnauthorized();
        return Promise.reject(error);
      }
    } else if (error.message === "Network Error") {
      message = "网络连接失败，请检查网络或后端服务是否正常";
    } else if (error.message) {
      message = error.message;
    }

    ElMessage.error(message);
    return Promise.reject(error);
  },
);

// 统一处理登录失效
function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  if (window.location.pathname !== "/login") {
    const redirect = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `/login?redirect=${redirect}`;
  }
}

export { baseURL, TOKEN_KEY };
export default request;
