<script setup lang="ts">
import { ref } from "vue";
import { downloadByData } from "@pureadmin/utils"
import {getAccountApi} from "@/api/accounts";
import { message } from '@/utils/message'
import type { UploadProps, UploadFile } from 'element-plus'
import { open } from '@tauri-apps/api/dialog';


// 声明 props 类型
export interface FormProps {
  formFields: any[];
}

// 声明 props 默认值
// 推荐阅读：https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-props
const props = withDefaults(defineProps<FormProps>(), {
  formFields: () => [],
});

// vue 规定所有的 prop 都遵循着单向绑定原则，直接修改 prop 时，Vue 会抛出警告。此处的写法仅仅是为了消除警告。
// 因为对一个 reactive 对象执行 ref，返回 Ref 对象的 value 值仍为传入的 reactive 对象，
// 即 newFormInline === props.formInline 为 true，所以此处代码的实际效果，仍是直接修改 props.formInline。
// 但该写法仅适用于 props.formInline 是一个对象类型的情况，原始类型需抛出事件
// 推荐阅读：https://cn.vuejs.org/guide/components/props.html#one-way-data-flow
const accountFields = ref([])

function onClickTxtDemo() {
  const blob = new Blob(['账号,密码,辅助邮箱\n' +
  'soniyakonika182@gmail.com,k1o7w3mk8onqkoj2,a594r96m52a0ols6@gmx.com'], { type: "text/plain" });
  downloadByData(blob,'示例.txt')
}
const accounts = ref([])
const accountOptions = ref([])

function initAccounts() {
  getAccountApi({
    page: 1,
    pageSize: 9999,
  }).then(res => {
    accountOptions.value = res.list.map(v => {
      return {
        ...v,
        ip: v.ipProxy,
        vm: v.vmProxy,
      }
    })
  })
}

initAccounts()


function transformValue(type, value) {
  if(type === 'string') {
    return value?.toString() ?? ''
  }
  return value
}

/**
 * 获取动态表单内容，整理成接口结构
 * @param item 点击按钮params.actions数据
 * @param params 动态数据全部结构信息
 * @param options 弹窗组件的数据信息
 * @param index 点击按钮的索引 params.actions的index
 */
function getFormData(item, params, options, index) {
  console.log(item, params, options, index)
  if(!validateForm()) return false
  const { actionType } = item
  const actionFormat = JSON.parse(JSON.stringify(params[`${actionType}Format`]))
  const formValues = JSON.parse(JSON.stringify(props.formFields))

  Object.entries(actionFormat).forEach(([key, value]) => {
    if(key === 'accounts') {
      actionFormat[key] = accountFields.value.map(v => {
        const item = {}
        Object.keys(value[0]).forEach(actionFormatItemKey => {
          item[actionFormatItemKey] = v[actionFormatItemKey]
        })
        return item
      })
    }else if(value === 'string') {
      actionFormat[key] = formValues.find(v => v.key === key)?.value ?? ''
    }
    /*
    * else if(Array.isArray(value)){
      actionFormat[key] = value.map((v, index) => {
        const currentValue = formValues.find(v => v.key.replace('File', '') === key)?.value[index] ?? {}
        return Object.entries(v).map(([key1, value1]) => {
          if(value1 === 'string') {
            return {
              [key1]: currentValue[key1] ?? ''
            }
          }
          return {
            [key1]: currentValue[key1] ?? ''
          }
        })
      })
    }
    * */
  })
  console.log(actionFormat, formValues)

  // 需要提交的数据结构,以params[`${actionType}Format`] 基准填入数据
  return actionFormat
}

function validateForm() {
  const validationData = [
    { label: '选择账号', value: accountFields.value },
    ...props.formFields
  ];

  const isValid = validationData.every(item => {
    if ((typeof item.value === 'string' && !item.value) || (Array.isArray(item.value) && item.value.length === 0)) {
      message(`表单【${item.label}】未填写`, { type: 'error' })
      return false; // 任何一个验证条件不满足，返回false
    }
    return true; // 验证条件满足，返回true
  });

  return isValid; // 如果所有验证条件都满足，返回true；否则，返回false
}

async function handleChange(uploadFile: UploadFile) {
   // 引入Tauri的fs模块
  console.log(uploadFile )
   // 读取文件内容
   // const content = await readTextFile(uploadFile.raw);
   // console.log('File content:', content);
}

function handleFile(item) {
   open({
    multiple: false,
    filters: [{
      name: '选择文件',
      extensions: item.attributes?.accept?.split(',').map(v => v.replace('.', '')) || []
    }]
  }).then((localPath) => {
     item.value = localPath
   })
}

function getFileName(filePath) {
  const parts = filePath.split('/'); // 使用斜杠分割路径
  return parts[parts.length - 1]
}

defineExpose({
  getFormData
})

</script>

<template>
  <el-form label-width="120px">
    <el-form-item label="选择账号" required>
      <el-select
        v-model="accountFields"
        multiple
        collapse-tags
        placeholder="请选择账号"
        class="!w-[220px]"
        value-key="account"
      >
        <el-option
          v-for="item in accountOptions"
          :key="item.account"
          :label="item.account"
          :value="item"
        />
      </el-select>
    </el-form-item>
    <template v-for="item in props.formFields">
      <el-form-item :label="item.label" required v-if="item.type === 'textarea'">
        <el-input
            class="!w-[220px]"
            textarea
            v-model="item.value"
            :placeholder="item.attributes.placeholder"
        />
      </el-form-item>
      <el-form-item :label="item.label" required v-if="item.type === 'file'">
        <div>
          <div>
            <el-button type="primary" text @click="handleFile(item)" >选择文件</el-button>
          </div>
          <el-text tag="div" size="small"  v-if="item.value">
            已选择文件 {{ getFileName(item.value)}}
          </el-text>
          <el-text tag="div" size="small">
            支持文件类型{{ item.attributes.accept }}
          </el-text>
        </div>
      </el-form-item>
    </template>
  </el-form>
</template>
