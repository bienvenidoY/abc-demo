import {defineStore} from "pinia";
import {taskType} from "@/store/modules/types";
import {store} from "@/store";
import { useStorage } from '@vueuse/core'


export const taskStore = defineStore({
  id: 'task-store',
  state: (): taskType => ({
    currentTaskId: useStorage('currentTaskId', '', sessionStorage),
    taskList:  useStorage('taskList', [], sessionStorage), // 本地存储，关闭软件清空
  }),
  actions: {
    CHANGE_TASK(taskId) {
      useStorage('currentTaskId', taskId, sessionStorage)
      this.currentTaskId = taskId
    },
    ADD_TASK(task) {
      if(!this.currentTaskId) {
        this.CHANGE_TASK(task.taskId)
      }
      const isRepeat = this.taskList.findIndex(v => v.taskId === task.taskId) > -1;
      if(!isRepeat) {
        this.taskList.push(task)
        useStorage('taskList', this.taskList, sessionStorage)
      }
    },
  }
})

export function useTaskStoreHook() {
  return taskStore(store);
}
