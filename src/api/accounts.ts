import { http } from "@/utils/http";

export type TableResult = {
  /** 当前页码 */
  page: number;
  /** 每页显示条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  list: [];
};

/** 获取任务队列 */
export const getAccountApi = (data?: object) => {
  return http.request<TableResult>("get", "v1/account", { params: data });
};
/** 新建账号 */
export const addAccountApi = (data?: object) => {
  return http.request<TableResult>("post", "v1/account", { data });
};

/** 删除账号 */
export const delAccountApi = (id: string) => {
  return http.request<TableResult>("delete", `/v1/account/${id}`);
};
