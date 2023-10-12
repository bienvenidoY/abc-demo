<script setup lang="ts">
import Logo from "./logo.vue";
import {h, resolveComponent} from 'vue'
import { useRoute } from "vue-router";
import { emitter } from "@/utils/mitt";
import SidebarItem from "./sidebarItem.vue";
import leftCollapse from "./leftCollapse.vue";
import { useNav } from "@/layout/hooks/useNav";
import { storageLocal } from "@pureadmin/utils";
import { responsiveStorageNameSpace } from "@/config";
import {ref, computed, watch, onBeforeMount, onMounted} from "vue";
import { findRouteByPath, getParentPaths } from "@/router/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { Command } from '@tauri-apps/api/shell'
import {message} from "@/utils/message";
import {ElNotification,  ElScrollbar,} from "element-plus";


const route = useRoute();
const showLogo = ref(
  storageLocal().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.showLogo ?? true
);

const { routers, device, pureApp, isCollapse, menuSelect, toggleSideBar } =
  useNav();

const subMenuData = ref([]);

const menuData = computed(() => {
  return pureApp.layout === "mix" && device.value !== "mobile"
    ? subMenuData.value
    : usePermissionStoreHook().wholeMenus;
});

const loading = computed(() =>
  pureApp.layout === "mix" ? false : menuData.value.length === 0 ? true : false
);

function getSubMenuData(path: string) {
  subMenuData.value = [];
  // path的上级路由组成的数组
  const parentPathArr = getParentPaths(
    path,
    usePermissionStoreHook().wholeMenus
  );
  // 当前路由的父级路由信息
  const parenetRoute = findRouteByPath(
    parentPathArr[0] || path,
    usePermissionStoreHook().wholeMenus
  );
  if (!parenetRoute?.children) return;
  subMenuData.value = parenetRoute?.children;
}

getSubMenuData(route.path);

onBeforeMount(() => {
  emitter.on("logoChange", key => {
    showLogo.value = key;
  });
});

watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    if (route.path.includes("/redirect")) return;
    getSubMenuData(route.path);
    menuSelect(route.path, routers);
  }
);

/*
*
* 定时器
*
* */
const isRunTimeout = ref(false)
let timerId = null; // 用于保存定时器的ID
const command = Command.sidecar('binaries/app', 'callApiAndRun')

// 开启定时器的方法
function startTimer() {
  if (timerId === null) {
    // 使用递归调用 setTimeout 实现每10秒执行一次的效果
    function repeat() {
      command.execute().then(outputVal => {
        if(outputVal.code === 0) {
         if(outputVal.stderr) {
           ElNotification({
             title: '自动化脚本执行错误',
             duration: 0,
             dangerouslyUseHTMLString: true,
             message: `<div style="height: 300px;overflow:scroll;">
              ${outputVal.stderr}
              </div>`
           })
         }
         if(isRunTimeout.value) {
           timerId = setTimeout(repeat, 10000); // 10000毫秒 = 10秒
         }else {
           stopTimer()
         }
        }else {
          message(outputVal.stderr, { type: 'error', duration: 5000})
          stopTimer()
          sidecarStatus.value = false
        }
      }).catch(e => {
        console.log(e)
      })
    }
    repeat(); // 第一次调用
    console.log('定时器已开启！');
  } else {
    console.log('定时器已经开启！');
  }
}

// 关闭定时器的方法
function stopTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
    console.log('定时器已关闭！');
  } else {
    console.log('定时器已经关闭！');
  }
}

const sidecarStatus = ref(false)

let timer2 = null
async function switchChange(val) {
  if(val) {
    isRunTimeout.value = true
    timer2 = setTimeout(() => {
      startTimer()
    }, 10* 1000)

  }else {
    isRunTimeout.value = false
    if(timer2) {
      clearTimeout(timer2)
      timer2 = null
    }
    stopTimer()
  }
}

</script>

<template>
  <div
    v-loading="loading"
    :class="['sidebar-container', showLogo ? 'has-logo' : '']"
  >
    <Logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar
      wrap-class="scrollbar-wrapper"
      :class="[device === 'mobile' ? 'mobile' : 'pc']"
    >
      <el-menu
        router
        unique-opened
        mode="vertical"
        class="outer-most select-none"
        :collapse="isCollapse"
        :default-active="route.path"
        :collapse-transition="false"
        @select="indexPath => menuSelect(indexPath, routers)"
      >
        <sidebar-item
          v-for="routes in menuData"
          :key="routes.path"
          :item="routes"
          :base-path="routes.path"
          class="outer-most select-none"
        />
      </el-menu>
    </el-scrollbar>
<!--    <leftCollapse
      v-if="device !== 'mobile'"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />-->
    <div class="flex justify-center pb-[200px]">
      <el-switch
        size="large"
        width="100%"
        v-model="sidecarStatus"
        class="ml-2 w-[80%]"
        inline-prompt
        style="--el-switch-on-color: #13ce66;--el-switch-off-color: #409eff"
        active-text="任务执行中"
        inactive-text="开始任务"
        @change="switchChange"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}
</style>
