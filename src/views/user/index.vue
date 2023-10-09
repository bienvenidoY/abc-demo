<script setup lang="ts">
import { ref } from "vue";
import { getTaskTablelistApi } from "@/api/task";
defineOptions({
  name: "user"
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
</script>

  <template>
  <div style="width: 95%">
    <el-table :data="tableData.list" border>
      <el-table-column prop="date" label="序号" />
      <el-table-column prop="name" label="账号" />
      <el-table-column prop="address" label="IP" />
      <el-table-column prop="address" label="VM" />
      <el-table-column prop="address" label="上一次使用" />
    </el-table>
    <div class="demo-pagination-block" style="float: right; margin-top: 15px">
      <el-pagination
        v-model:current-page="tableData.page"
        v-model:page-size="tableData.pageSize"
        :page-sizes="[10, 50, 100, 120]"
        size="small"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>


