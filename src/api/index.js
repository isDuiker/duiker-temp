/**
 * API 接口统一出口
 *
 * 使用方式：
 * import { getUserList } from "@/api";
 *
 * 新增业务模块时，在此处继续导出即可，例如：
 * export * from "./auth";
 * export * from "./order";
 */

export { default as request } from "@/utils/request";
export * from "./user";
export * from "./device";
export * from "./chart";
