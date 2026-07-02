<template>
  <div>
    <div class="subtabs">
      <button class="st" :class="{ on: sub === 'user' }" @click="sub = 'user'"><i class="fa-solid fa-user"></i> 계정</button>
      <button class="st" :class="{ on: sub === 'role' }" @click="sub = 'role'"><i class="fa-solid fa-user-shield"></i> 역할·권한</button>
    </div>
    <UserAdmin v-if="sub === 'user'" />
    <RoleAdmin v-else />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import UserAdmin from "@/pages/settings/UserAdmin.vue";
import RoleAdmin from "@/pages/settings/RoleAdmin.vue";

const sub = ref("user");
</script>

<style scoped>
.subtabs { display: flex; gap: 0.4rem; margin-bottom: 1.1rem; }
.st {
  display: inline-flex; align-items: center; gap: 0.4rem;
  height: 34px; padding: 0 0.9rem; border-radius: 9px;
  font-size: 0.85rem; font-weight: 600; color: #7a6e5c;
  background: #f4ead6; border: 1px solid #e2d4b6;
}
.st:hover { background: #ece0c6; }
.st.on { color: #fdefe2; background: var(--seal); border-color: #8e2a20; }
</style>
