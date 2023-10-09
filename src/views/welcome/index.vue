<script setup lang="ts">
import { ref } from "vue";
import type { Ref } from 'vue'
import Segmented, { type OptionsType } from "@/components/ReSegmented";
import NoResult from './components/NoResult.vue'

import { getWeclomeTableListApi } from "@/api/weclome";
import {useTaskStoreHook} from "@/store/modules/task";
defineOptions({
  name: "Welcome"
});

/** 基础用法 */
const optionsBasis: Ref<OptionsType[]> = ref([]);

const tableData = ref({
  page: 1,
  pageSize: 10,
  list: [],
  total: 0,
})

// 初始化cards
async function initTable() {
  console.log(useTaskStoreHook().currentTaskId)
  const  { list = [], total = 0 } = await getWeclomeTableListApi({
    page: tableData.value.page,
    pageSize: tableData.value.pageSize,
    taskId: useTaskStoreHook().currentTaskId
  });
  tableData.value.list = list;
  tableData.value.total = total;
}
function init() {
  optionsBasis.value = useTaskStoreHook().taskList.map(v => {
    return {
      label: v.taskName,
      value: v.taskId,
    }
  })
  if(optionsBasis.value.length) {
    tableData.value = Object.assign({}, {
      page: 1,
      pageSize: 10,
      list: [],
      total: 0,
    })
    initTable()
  }
}

function segmentChange({option}) {
  useTaskStoreHook().CHANGE_TASK(option.value)
  init()
}


init();
</script>
<template>
  <div>
    <el-card  style="min-height: calc(100vh - 60px)" v-if="optionsBasis.length">
     <div style="margin-bottom: 10px">
       <Segmented :options="optionsBasis" @change="segmentChange"/>
     </div>

      <el-table :data="tableData.list" border>
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="title" label="功能" />
        <el-table-column prop="timestamp" label="时间" />
        <el-table-column prop="logLevel" label="等级" />
        <el-table-column prop="message" label="消息" />
      </el-table>
      <div class="demo-pagination-block" style="float: right; margin-top: 15px">
        <el-pagination
          v-model:current-page="tableData.page"
          v-model:page-size="tableData.pageSize"
          :page-sizes="[10, 50, 100, 120]"
          size="small"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableData.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <NoResult v-else/>
  </div>
</template>
