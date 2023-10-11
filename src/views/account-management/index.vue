<template>
  <div>
    <div class="header">
      <el-space direction="vertical" alignment="normal">
        <el-button type="primary" @click="handleImportAccount"
          >导入账号</el-button
        >
        <el-text size="small">
          文件格式Excel
          <el-button size="small" type="primary" text @click="onClickTxtDemo"
            >下载示例</el-button
          >
        </el-text>
      </el-space>
    </div>
    <div style="width: 95%; padding-top: 20px">
      <el-table :data="tableData.list" border>
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="password" label="密码" />
        <el-table-column prop="auxiliaryEmail" label="辅助邮箱" />
        <el-table-column prop="ipProxy" label="代理IP">
          <template #default="{ row }">
            <el-tooltip
              :content="row.ipProxy"
              effect="light"
            >
              <el-button link type="primary">查看IP</el-button>
            </el-tooltip>
        </template>
        </el-table-column>
        <el-table-column prop="vmProxy" label="VM指纹" >
          <template #default="{ row }">
            <el-tooltip
              effect="light"
              :content="row.vmProxy"
            >
              <el-button link type="primary">查看VM</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDelItem(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
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
    <Dialog
      :ref="setRefs('dialogRef')"
      :list="importList"
      @close="importList = []"
      @editList="e => (importList = e)"
      @success="
        importList = [];
        initTable();
      "
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from "element-plus";
import { exportExcelFile, useImportExcel } from "@/hooks/useImportExcel";
import { ref } from "vue";
import Dialog from "./components/importDialog.vue";
import { useRefs } from "@/hooks/useRef";
import { getAccountApi, delAccountApi } from "@/api/accounts";
import { message } from "@/utils/message";

defineOptions({
  name: "AccountManagement"
});

const importList = ref([]);
const { setRefs, refs } = useRefs();

const tableData = ref({
  page: 1,
  pageSize: 10,
  list: [],
  total: 0
});
const handleSizeChange = (val: number) => {
  tableData.value.page = 1;
  tableData.value.pageSize = val;
  initTable();
};
const handleCurrentChange = (val: number) => {
  tableData.value.page = val;
  initTable();
};
// 初始化表格
const initTable = async () => {
  const { list = [], total = 0 } = await getAccountApi({
    page: tableData.value.page,
    pageSize: tableData.value.pageSize
  });
  tableData.value.list = list;
  tableData.value.total = total;
};
initTable();

const onClickTxtDemo = () => {
  exportExcelFile([
    {
      账号: "123456",
      密码: "123123",
      辅助邮箱: "123@xx.com"
    }
  ]).then(res => {
    message('示例下载成功', {type: 'success'})
  }).catch(err => {
    message(`示例下载失败：${err}`, {type: 'error'})
  })
};

const handleDelItem = row => {
  ElMessageBox.confirm("确定要删除吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      return delAccountApi(row.id);
    })
    .then(() => {
      message("删除成功", { type: "success" });
      tableData.value.page = 1;
      initTable();
    });
};

/**
 * 导入账号
 */
const handleImportAccount = () => {
  useImportExcel().then(res => {
    res.forEach(d => {
      importList.value.push(...d.tableValue);
    });
    refs.dialogRef.dialogVisible = true;
  });
};
</script>

<style lang="scss" scoped></style>
