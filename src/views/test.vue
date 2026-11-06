<template>
  <div>
    <h1>测试页面</h1>
    <div class="container">login</div>
    <button @click="loadUsers">请求1</button>
  </div>
</template>
<script setup>
import { getUserList } from "@/api";
const loadUsers = async () => {
  const data = await getUserList({ page: 1, pageSize: 10 });
  console.log(data);
};
</script>
