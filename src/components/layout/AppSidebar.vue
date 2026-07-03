<template>
  <aside class="side" :class="{ open, mobile: isMobile, closed: !open }">
    <div class="scan" aria-hidden="true"></div>
    <div class="brand">
      <div class="mark" aria-hidden="true">CS</div>
      <div v-if="open" class="word">
        <span class="ko">CS</span>
        <span class="sub">Customer Service</span>
      </div>
    </div>

    <nav class="menu">
      <RouterLink
        v-for="m in visibleMenus"
        :key="m.to"
        :to="m.to"
        class="item"
        :class="{ on: isActive(m) }"
        :title="m.label"
        @click="isMobile && emit('close')"
      >
        <i class="fa-solid ic" :class="m.icon"></i>
        <span v-if="open" class="lbl">{{ m.label }}</span>
      </RouterLink>
    </nav>

    <div v-if="open" class="foot">v0.1 · READY ▮</div>
  </aside>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { boardApi } from "@/api/board";
import { useAuthStore } from "@/stores/auth";

defineProps({ open: { type: Boolean, default: true }, isMobile: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);

const route = useRoute();
const auth = useAuthStore();
const boards = ref([]);

const menus = computed(() => [
  { label: "대시보드", to: "/", icon: "fa-gauge-high", exact: true },
  { label: "업체 정산", to: "/settlement/vendor", icon: "fa-store", perm: "settlement.view" },
  { label: "게임사 정산", to: "/settlement/gameco", icon: "fa-gamepad", perm: "settlement.view" },
  { label: "장부 관리", to: "/ledger", icon: "fa-book", perm: "ledger.view" },
  { label: "업체 응대", to: "/support/vendor", icon: "fa-headset", perm: "support.view" },
  { label: "게임사 응대", to: "/support/gameco", icon: "fa-comments", perm: "support.view" },
  { label: "솔루션 응대", to: "/support/solution", icon: "fa-puzzle-piece", perm: "support.view" },
  { label: "자주 하는 질문", to: "/faq", icon: "fa-circle-question", perm: "faq.view" },
  ...boards.value.map((b) => ({ label: b.name, to: `/board/${b.slug}`, icon: "fa-clipboard-list", perm: "board.view" })),
  { label: "환율 정보", to: "/exchange", icon: "fa-money-bill-trend-up" },
  { label: "환경설정", to: "/settings", icon: "fa-gear", perm: ["gameCompany.view", "vendor.view", "usermanager.view", "permission.user.view", "permission.menu.view"] },
]);

// 권한 필터: perm(문자열/배열) 중 하나라도 보유해야 노출 (super는 항상 통과, perm 없으면 공개)
function allowed(perm) {
  if (!perm) return true;
  const codes = Array.isArray(perm) ? perm : [perm];
  return codes.some((c) => auth.hasPermission(c));
}
const visibleMenus = computed(() => menus.value.filter((m) => allowed(m.perm)));

function isActive(m) {
  if (m.exact) return route.path === m.to;
  return route.path === m.to || route.path.startsWith(m.to + "/");
}

async function load() {
  try { boards.value = await boardApi.list(); } catch (e) { boards.value = []; }
}
onMounted(load);
</script>

<style scoped>
.side { position: relative; width: 236px; flex-shrink: 0; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; color: #d7d9e8; background: #16182a; border-right: 3px solid var(--line-hard); transition: width 0.2s ease, transform 0.2s ease; overflow: hidden; }
.side.closed { width: 72px; }
.scan { position: absolute; inset: 0; pointer-events: none; opacity: 0.35; background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, transparent 2px 4px); }

.brand { position: relative; z-index: 1; height: 64px; display: flex; align-items: center; gap: 0.7rem; padding: 0 1rem; border-bottom: 2px solid rgba(122, 92, 255, 0.25); }
.mark { flex-shrink: 0; width: 40px; height: 40px; display: grid; place-items: center; font-family: var(--font-pixel); font-weight: 700; font-size: 1rem; color: #fff; background: var(--seal); border: 2px solid #0d0e1a; box-shadow: 3px 3px 0 #0d0e1a; letter-spacing: 0.02em; }
.word { display: flex; flex-direction: column; line-height: 1.15; overflow: hidden; }
.word .ko { font-family: var(--font-pixel); font-size: 1.1rem; color: #fff; letter-spacing: 0.04em; }
.word .sub { font-family: var(--font-pixel); font-size: 0.58rem; color: #8b90b8; letter-spacing: 0.1em; }

.menu { position: relative; z-index: 1; flex: 1; padding: 0.75rem 0.6rem; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
.item { display: flex; align-items: center; gap: 0.7rem; padding: 0.55rem 0.7rem; color: rgba(215, 217, 232, 0.72); font-size: 0.86rem; font-weight: 600; text-decoration: none; position: relative; transition: background 0.12s, color 0.12s; cursor: pointer; border: 2px solid transparent; border-radius: 3px; }
.closed .item { justify-content: center; }
.item .ic { width: 20px; text-align: center; font-size: 0.95rem; color: rgba(154, 159, 187, 0.8); transition: color 0.12s; }
.item:hover { background: rgba(122, 92, 255, 0.12); color: #fff; }
.item:hover .ic { color: #c3b7ff; }
.item.on { background: rgba(122, 92, 255, 0.2); color: #fff; border-color: var(--seal); box-shadow: 2px 2px 0 #0d0e1a; }
.item.on .ic { color: #c3b7ff; }
.chev { margin-left: auto; font-size: 0.62rem; opacity: 0.5; transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }

.children { display: flex; flex-direction: column; gap: 1px; margin: 2px 0 4px 0.85rem; padding-left: 0.55rem; border-left: 2px solid rgba(122, 92, 255, 0.22); }
.child { display: flex; align-items: center; gap: 0.5rem; padding: 0.42rem 0.6rem; border-radius: 3px; font-size: 0.82rem; color: rgba(215, 217, 232, 0.6); text-decoration: none; transition: background 0.12s, color 0.12s; }
.child .dot { width: 5px; height: 5px; background: rgba(154, 159, 187, 0.6); }
.child:hover { background: rgba(122, 92, 255, 0.1); color: #fff; }
.child.on { color: #fff; }
.child.on .dot { background: var(--seal); }
.child.empty { color: rgba(154, 159, 187, 0.35); cursor: default; }

.foot { position: relative; z-index: 1; padding: 0.8rem 1rem; font-family: var(--font-pixel); font-size: 0.62rem; letter-spacing: 0.08em; color: rgba(154, 159, 187, 0.5); border-top: 2px solid rgba(122, 92, 255, 0.18); }
.side.mobile { position: fixed; left: 0; top: 0; z-index: 60; box-shadow: 6px 0 0 rgba(13, 14, 26, 0.4); }
.side.mobile.closed { transform: translateX(-100%); width: 236px; }
</style>
