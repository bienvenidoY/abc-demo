import { defineStore } from "pinia";
import { store } from "@/store";
import { routerArrays } from "@/layout/types";
import { router, resetRouter } from "@/router";
import { storageSession } from "@pureadmin/utils";
import { getLogin, refreshTokenApi } from "@/api/user";
import { UserResult } from "@/api/user";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { setToken, removeToken } from "@/utils/auth";

export const useUserStore = defineStore({
  id: "pure-user",
  actions: {
    /** 登入 */
    async loginByToken(data) {
      return new Promise<UserResult>((resolve, reject) => {
        getLogin({
          token: data.token
        }).then(res => {
          let obj = {
            accessToken: data.token,
            expires: res.expireAt,
            activationAt: res.activationAt,
          }
          setToken(obj);
          resolve(obj);
        })
          .catch(() => {
            reject()
          })
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
