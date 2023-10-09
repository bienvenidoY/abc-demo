import { http } from "@/utils/http";

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


/** 获取功能市场 */
export const getMarketTablelistApi = (data?: object) => {
  return http.request<TablelistResult>("get", "/v1/cards", { params: data });
};
