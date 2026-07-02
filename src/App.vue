<template>
  <RootLayout />
  <BaseModal />
  <AlertModal
    :visible="alertStore.visible"
    :title="alertStore.title"
    :message="alertStore.message"
    :type="alertStore.type"
    :variant="alertStore.variant"
    @ok="alertStore.ok"
    @cancel="alertStore.cancel"
  />
</template>

<script setup lang="ts">
// @ts-nocheck
import RootLayout from "@/layouts/RootLayout.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import AlertModal from "@/components/base/AlertModal.vue";
import { alertStore } from "@/plugins/alert.store";
import { onBeforeMount } from "vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
onBeforeMount(() => auth.restore());
</script>
