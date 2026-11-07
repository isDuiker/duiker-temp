<template>
  <d-querybox
    :params="query"
    :auto-query="false"
    @submit="handleSearch"
    @reset="handleReset"
  >
    <!-- <el-form-item label="名称">
      <el-input v-model="query.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item label="编码">
      <el-input v-model="query.code" placeholder="请输入编码" />
    </el-form-item> -->
    <el-form-item label="状态">
      <el-select
        v-model="query.status"
        placeholder="请选择状态"
        style="width: 200px"
      >
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
      </el-select>
    </el-form-item>
    <el-form-item label="负责人">
      <el-input v-model="query.owner" placeholder="请输入负责人" />
    </el-form-item>
    <el-form-item label="创建日期">
      <el-date-picker
        v-model="query.date"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="请选择日期"
      />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="query.remark" placeholder="请输入备注" />
    </el-form-item>
  </d-querybox>
</template>

<script setup>
import { reactive, ref } from "vue";

const createQuery = () => ({
  name: "",
  code: "",
  status: "",
  owner: "",
  date: "",
  remark: "",
});

const query = reactive(createQuery());
const lastQuery = ref(null);

function handleSearch() {
  lastQuery.value = { ...query };
}

function handleReset() {
  Object.assign(query, createQuery());
  lastQuery.value = null;
}
</script>

<style scoped lang="scss"></style>
