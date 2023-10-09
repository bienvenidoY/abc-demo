<script setup lang="tsx">
import { ref } from "vue";
import { getMarketTablelistApi } from "@/api/market";
import {useTaskStoreHook} from "@/store/modules/task";
import { ElNotification } from 'element-plus'
import Forms, { type FormProps } from "./form.vue";
import { http } from "@/utils/http";
import {
  addDialog,
  closeDialog,
  closeAllDialog
} from "@/components/ReDialog";


defineOptions({
  name: "Market"
});

const tableData = ref({
  page: 1,
  pageSize: 10,
  list: [],
  total: 0,
})

function handleSizeChange(val: number) {
  tableData.value.page = 1;
  tableData.value.pageSize = val;
  initTable();
}
function handleCurrentChange(val: number) {
  tableData.value.page = val;
  initTable();
}
// 初始化cards
async function initTable() {
  const  { list = [], total = 0 } = await getMarketTablelistApi({
    page: tableData.value.page,
    pageSize: tableData.value.pageSize
  });
  tableData.value.list = list; // 赋值总条数给 total
  tableData.value.total = total;
}

initTable();


function onFormSubmit(item, params, options, index, fromRef, itemData) {
  const taskData = fromRef.value.getFormData(item, params, options, index)

  const { endpoint: { method, url } } = item
  http.request(method, url, {data: {
      taskData: JSON.stringify(taskData),
      functionalCardId: itemData.id,
      accountCount: taskData.accounts.length,
    }}).then((res) => {
    closeDialog(options, index)
    useTaskStoreHook().ADD_TASK({
      taskId: itemData.id,
      taskName: itemData.title,
    })

    ElNotification({
      title: '任务执行成功',
      message: '请前往菜单【看板】中查看',
      type: 'success',
    })
  })
}


function onBeforeCancelClick(itemData) {
  console.log("params", JSON.parse(itemData.params));
  const params = JSON.parse(itemData.params)
  const fromRef = ref(null)

  addDialog({
    title: itemData.title,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    width: "40%",
    contentRenderer: () => <Forms ref={fromRef}/>,
    props: {
      // 赋默认值
      formFields: params.fields.map(v => {
        return {
          value: '',
          ...v,
        }
      })
    },
    footerRenderer: ({ options, index }) => (
        <div>
          <el-button onClick={() => closeDialog(options, index)} text bg>
            取消
          </el-button>
          {
            params.actions.map(item => {
              return <el-button
                  key={item.actionType}
                  text bg
                  type={'primary'}
                  onClick={() => onFormSubmit(item, params, options, index, fromRef, itemData)}>
                {item.label}
              </el-button>
            })
          }
        </div>
    ),
  });
}
</script>

<template>
  <div style="width: 95%">
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in tableData.list" :key="item.id">
        <el-card
          style="min-height: 220px; margin-bottom: 15px"
          shadow="hover"
          @click="onBeforeCancelClick(item)"
        >
          <div>
            <div class="el-row is-justify-space-between">
              <div class="list-card-item_detail--logo">
                <svg
                  width="1em"
                  height="1em"
                  fill="none"
                  class="t-icon t-icon-user-avatar"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill="currentColor"
                    d="M8 10.5c1.24 0 2.42.31 3.5.88v1.12h1v-1.14a.94.94 0 0 0-.49-.84 8.48 8.48 0 0 0-8.02 0 .94.94 0 0 0-.49.84v1.14h1v-1.12A7.47 7.47 0 0 1 8 10.5zM10.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm-1 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="M2.5 1.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1h-11zm11 1v11h-11v-11h11z"
                  ></path>
                </svg>
              </div>
              <div class="list-card-item_detail--operation">
                <span
                  class="el-tag el-tag--dark mx-1 list-card-item_detail--operation--tag"
                  style="background-color: rgb(0, 168, 112)"
                  ><span class="el-tag__content">{{ item.version }}</span>
                </span>
              </div>
            </div>
            <p class="list-card-item_detail--name text-text_color_primary">
              {{ item.title }}
            </p>
            <p class="list-card-item_detail--desc text-text_color_regular">
              {{ item.desc }}
            </p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <div class="demo-pagination-block" style="float: right; margin-top: 15px">
      <el-pagination
        v-model:current-page="tableData.page"
        v-model:page-size="tableData.pageSize"
        :page-sizes="[10, 50, 100, 120]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="tableData.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/market.css");
</style>
