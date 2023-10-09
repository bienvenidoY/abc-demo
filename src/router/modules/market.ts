// 最简代码，也就是这些字段必须有
export default {
  path: "/market",
  meta: {
    icon: "platform",
    title: "功能市场",
    rank: 1
  },
  children: [
    {
      path: "/market",
      name: "Market",
      component: () => import("@/views/market/index.vue"),
      meta: {
        title: "功能市场"
      }
    }
  ]
};
