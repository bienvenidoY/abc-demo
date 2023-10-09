import { storageLocal, storageSession } from "@pureadmin/utils";
import { useUserStoreHook } from "@/store/modules/user";

export interface DataInfo {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: string;
  /** 用于调用刷新accessToken的接口时所需的token */
  activationAt: string;
}

export const UserInfoKey = "user-info";
export const TokenKey = "authorized-token";

/** 获取`token` */
export function getToken(): DataInfo {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  return storageLocal().getItem(TokenKey)
}

export function setToken(data: DataInfo) {
  const { accessToken, expires, activationAt } = data;
  storageLocal().setItem(TokenKey, accessToken)

  storageLocal().setItem(UserInfoKey, {
    activationAt,
    expires,
  })
}

/** 删除`token`以及key值为`user-info`的session信息 */
export function removeToken() {
  storageLocal.removeItem(TokenKey);
  sessionStorage.clear();
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return token;
};
