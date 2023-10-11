<script setup lang="ts">
import { ref } from "vue";
import { getTaskTablelistApi } from "@/api/task";
defineOptions({
  name: "Task"
});

const tableData = ref({
  page: 1,
  pageSize: 10,
  list: [],
  total: 0,
})
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
  const { list = [], total = 0  } = await getTaskTablelistApi({
    page: tableData.value.page,
    pageSize: tableData.value.pageSize
  });
  tableData.value.list = list;
  tableData.value.total = total;
};
initTable();
</script>

  <template>
  <div style="width: 95%">
    <el-table :data="tableData.list" border>
      <el-table-column prop="id" label="id" width="80" />
      <el-table-column prop="title" label="功能" />
      <el-table-column prop="retryCount" label="重拾次数" width="120"/>
      <el-table-column prop="accountCount" label="任务数量" width="120"/>
      <el-table-column prop="errorMessage" label="错误日志"/>
      <el-table-column prop="startTime" label="开始时间" />
      <el-table-column prop="endTime" label="结束时间" />
      <el-table-column prop="status" label="状态" />
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
</template>


