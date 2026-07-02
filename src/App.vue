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
import { onBeforeMount, onBeforeUnmount, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAlertsStore } from "@/stores/alerts";

const auth = useAuthStore();
const alerts = useAlertsStore();
onBeforeMount(() => auth.restore());

// 로그인 상태에서 알림 30초 자동 갱신, 로그아웃 시 중지
watch(
  () => auth.token,
  (t) => { if (t) alerts.startPolling(30000); else alerts.stopPolling(); },
  { immediate: true },
);
// 탭이 다시 보이면 즉시 갱신
function onVisible() { if (document.visibilityState === "visible" && auth.token) alerts.fetch(); }
document.addEventListener("visibilitychange", onVisible);
onBeforeUnmount(() => { document.removeEventListener("visibilitychange", onVisible); alerts.stopPolling(); });
</script>
