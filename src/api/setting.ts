import { http } from "@/utils/http";
import { baseUrlApi } from "./utils";

export type TablelistResult = {
  success: boolean;
  data: {
    "maxWorkerRun": number,
    "ipProxy": string,
    "vmProxy": string
  };
};


/** 上报软件设置 */
export const getSettingTablelistApi = (data?: object) => {
  return http.request<TablelistResult>("post", 'v1/config', { data });
};
