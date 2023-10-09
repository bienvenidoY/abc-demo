<script setup lang="ts">
import {useRouter} from "vue-router";

defineOptions({
  name: "NoResult"
});
const router = useRouter();
</script>

<template>
  <div class="flex justify-center items-center h-[340px]">
    <div>
      <p
        class="font-medium text-4xl mb-4 dark:text-white text-center"
        v-motion
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 100
          }
        }"
      >
        提示
      </p>
      <p
        class="mb-4 text-gray-500 text-center"
        v-motion
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 300
          }
        }"
      >
        还没有执行任务，去功能市场看看吧！
      </p>
      <p class="text-center">
        <el-button
          type="primary"
          @click="router.push('/market')"
          v-motion
          :initial="{
          opacity: 0,
          y: 100
        }"
          :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 500
          }
        }"
        >
          前往功能市场
        </el-button>

      </p>
    </div>
  </div>
</template>
