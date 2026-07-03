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
import { onBeforeMount, onMounted, onBeforeUnmount, watch, getCurrentInstance } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAlertsStore } from "@/stores/alerts";
import { useI18nStore } from "@/stores/i18n";

const auth = useAuthStore();
const alerts = useAlertsStore();
const i18n = useI18nStore();
onBeforeMount(() => auth.restore());

// 전역 $t 등록 (한국어 키 → 현재 언어)
const instance = getCurrentInstance();
if (instance) instance.appContext.config.globalProperties.$t = (key: string) => i18n.t(key);

// i18n 초기화: 저장된 언어 복원 + 번역팩 로드
onMounted(() => {
  i18n.initLocale();
  i18n.loadLangPacks();
});
// 로그인되면 번역팩 재로드(권한/세션 반영)
watch(() => auth.token, (t) => { if (t) i18n.loadLangPacks(); });

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
