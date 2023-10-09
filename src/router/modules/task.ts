// 最简代码，也就是这些字段必须有
export default {
  path: "/task",
  meta: {
    icon: "trendCharts",
    title: "任务队列",
    rank: 3
  },
  children: [
    {
      path: "/task",
      name: "Task",
      component: () => import("@/views/task/index.vue"),
      meta: {
        title: "任务队列"
      }
    }
  ]
};
