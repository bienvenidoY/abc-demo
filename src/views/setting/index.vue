<script setup lang="ts">
import { ref } from "vue";
import { getSettingTablelistApi } from "@/api/setting";
import dayjs from 'dayjs'
import { getToken, UserInfoKey } from "@/utils/auth";
import { storageLocal } from "@pureadmin/utils";
import { message } from '@/utils/message'

defineOptions({
  name: "setting"
});

const originObj = {
  ip: "",
  vm: ""
};

const form = ref({ ...originObj });

const isDisabled = ref(true);

async function onSubmit() {
  const { ip, vm } = form.value;
  getSettingTablelistApi({
    maxWorkerRun: 1,
    ipProxy: ip,
    vmProxy: vm
  }).then(() => {
    isDisabled.value = true;
    message('设置成功', {type: 'success'})
  })
  .catch(() => {

  })
}
function onCancel() {
  form.value = { ...originObj };
  isDisabled.value = true;
}
</script>

<template>
  <el-card style="min-height: calc(100vh - 60px)">
    <el-form :model="form" label-width="120px" :disabled="isDisabled">
      <el-form-item label="激活时间">{{ storageLocal().getItem(UserInfoKey).activationAt }}</el-form-item>
      <el-form-item label="过期时间">{{ storageLocal().getItem(UserInfoKey).expires }}</el-form-item>
      <el-form-item label="IP设置">
        <el-input v-model="form.ip" style="width: 300px" placeholder="请输入" />
        <a href="https://share.netnut.cn/5QsYCrJuSaYPQXF" __blank style="margin-left: 10px; color: orange"
          >推荐IP链接</a
        >
      </el-form-item>
      <el-form-item label="VM设置">
        <el-input v-model="form.vm" style="width: 300px" placeholder="请输入" />
        <a href="javascript:void(0)" style="margin-left: 10px; color: orange"
          >推荐VM链接</a
        >
      </el-form-item>
    </el-form>
    <div style="margin-left: 80px">
      <el-button
        type="primary"
        v-if="isDisabled"
        style="width: 300px"
        @click="isDisabled = false"
        >设置参数</el-button
      >
      <div v-else>
        <el-button @click="onCancel" style="width: 120px">取消</el-button>
        <el-button style="width: 120px" type="primary" @click="onSubmit"
          >保存</el-button
        >
      </div>
    </div>
  </el-card>
</template>
