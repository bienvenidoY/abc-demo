<template>
  <el-dialog
    v-model="dialogVisible"
    title="账号列表"
    width="50%"
    :before-close="handleClose"
  >
    <div class="header">
      <el-form-item label="IP数量">
        <el-input placeholder="请输入IP数量" v-model="ipNum" />
      </el-form-item>
      <el-form-item label="VM数量">
        <el-input placeholder="请输入VM数量" v-model="vmNum" />
      </el-form-item>
    </div>
    <el-table :data="list" size="small" border height="400px">
      <el-table-column prop="账号" label="账号" />
      <el-table-column prop="密码" label="密码" />
      <el-table-column prop="辅助邮箱" label="辅助邮箱" />
      <el-table-column label="操作">
        <template #default="{ $index }">
          <el-button link type="primary" @click="handleDelItem($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" text bg>取消</el-button>
        <el-button type="primary" @click="handleSave" text bg> 保存 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { addAccountApi } from "@/api/accounts";

defineOptions({
  name: "importDialog"
});
const $emit = defineEmits(["close", "editList"]);
const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
});

const dialogVisible = ref(false);
const ipNum = ref("");
const vmNum = ref("");
const handleClose = () => {
  ipNum.value = "";
  vmNum.value = "";
  $emit("close");
  dialogVisible.value = false;
};
const handleSave = () => {
  if (!ipNum.value) {
    ElMessage.error("请输入ip数量");
    return;
  }
  if (!vmNum.value) {
    ElMessage.error("请输入vm数量");
    return;
  }
  const reslut = props.list.map(item => {
    return {
      account: item["账号"],
      password: item["密码"].toString(),
      auxiliaryEmail: item["辅助邮箱"],
    };
  });
  addAccountApi({ ipNum: ipNum.value, vmNum: vmNum.value, list: reslut }).then(() => {
    ElMessage.success("保存成功");
    $emit("success");
    dialogVisible.value = false;
  });
};
const handleDelItem = index => {
  const reslut = [...props.list];
  reslut.splice(index, 1);
  $emit("editList", reslut);
};
defineExpose({
  dialogVisible
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  > div {
    margin-right: 20px;
  }
}
</style>
