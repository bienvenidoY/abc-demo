import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

export type TablelistResult = {
  success: boolean;
  data: {
    /** 当前页码 */
    page: number;
    /** 每页显示条数 */
    pageSize: number;
    /** 总条数 */
    total: number
  };
};


/** 获取任务队列 */
export const getTaskTablelistApi = (data?: object) => {
  return http.request<TablelistResult>("get",'v1/tasks', { params: data });
};
