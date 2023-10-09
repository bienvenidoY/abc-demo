// 最简代码，也就是这些字段必须有
export default {
  path: "/setting",
  meta: {
    icon: "setting",
    title: "软件设置",
    rank: 4
  },
  children: [
    {
      path: "/setting",
      name: "Setting",
      component: () => import("@/views/setting/index.vue"),
      meta: {
        title: "软件设置",
      }
    },
  ]
};
