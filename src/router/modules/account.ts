// 最简代码，也就是这些字段必须有
export default {
  path: "/account",
  meta: {
    icon: "platform",
    title: "账号管理",
    rank: 4
  },
  children: [
    {
      path: "/account",
      name: "Account",
      component: () => import("@/views/account-management/index.vue"),
      meta: {
        title: "账号管理"
      }
    }
  ]
};
