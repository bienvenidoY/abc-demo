import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

export type TablelistResult = {
  success: boolean;
  data: {
    /** 当前页码 */
    page: number;
    /** 每页显示条数 */
    pageSize: number;
    /** 任务ID */
    task_id: string
  };
};


/** 获取看板数据 */
export const getWeclomeTableListApi = (data?: object) => {
  return http.request<TablelistResult>("get", 'v1/logs', { params: data });
};
