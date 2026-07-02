<template>
  <aside class="side" :class="{ open, mobile: isMobile, closed: !open }">
    <div class="brand">
      <div class="mark" aria-hidden="true">CS</div>
      <div v-if="open" class="word">
        <span class="ko">CS ERP</span>
        <span class="sub">고객센터 관리</span>
      </div>
    </div>

    <nav class="menu">
      <template v-for="m in menus" :key="m.label">
        <!-- 단일 링크 -->
        <RouterLink
          v-if="m.to"
          :to="m.to"
          class="item"
          :class="{ on: isActive(m) }"
          :title="m.label"
          @click="isMobile && emit('close')"
        >
          <i class="fa-solid ic" :class="m.icon"></i>
          <span v-if="open" class="lbl">{{ m.label }}</span>
        </RouterLink>

        <!-- 하위 메뉴 그룹 -->
        <template v-else>
          <div class="item group" :class="{ on: groupActive(m) }" :title="m.label" @click="toggle(m)">
            <i class="fa-solid ic" :class="m.icon"></i>
            <span v-if="open" class="lbl">{{ m.label }}</span>
            <i v-if="open" class="fa-solid fa-chevron-down chev" :class="{ up: expanded[m.label] }"></i>
          </div>
          <div v-if="open && expanded[m.label]" class="children">
            <RouterLink
              v-for="c in m.children"
              :key="c.to"
              :to="c.to"
              class="child"
              :class="{ on: isActive(c) }"
              @click="isMobile && emit('close')"
            >
              <span class="dot"></span>{{ c.label }}
            </RouterLink>
            <div v-if="!m.children.length" class="child empty">항목 없음</div>
          </div>
        </template>
      </template>
    </nav>

    <div v-if="open" class="foot">CS ERP · 고객센터</div>
  </aside>
</template>

<script setup lang="ts">
// @ts-nocheck
import { reactive, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { ref } from "vue";
import { boardApi } from "@/api/board";

defineProps({ open: { type: Boolean, default: true }, isMobile: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);

const route = useRoute();
const boards = ref([]);
const expanded = reactive({ "지급/회수": true, "CS 관리": true, 게시판: false });

const menus = computed(() => [
  { label: "대시보드", to: "/", icon: "fa-gauge-high", exact: true },
  {
    label: "지급/회수",
    icon: "fa-money-bill-transfer",
    children: [
      { label: "정산 관리", to: "/settlement/vendor" },
      { label: "장부 관리", to: "/ledger" },
      { label: "게임사 정산", to: "/settlement/gameco" },
    ],
  },
  {
    label: "CS 관리",
    icon: "fa-headset",
    children: [
      { label: "업체 응대", to: "/support/vendor" },
      { label: "게임사 응대", to: "/support/gameco" },
      { label: "자주 하는 질문", to: "/faq" },
    ],
  },
  { label: "게시판", icon: "fa-clipboard-list", children: boards.value.map((b) => ({ label: b.name, to: `/board/${b.slug}` })) },
  { label: "마이페이지", to: "/mypage", icon: "fa-id-card" },
  { label: "환경설정", to: "/settings", icon: "fa-gear" },
]);

function isActive(m) {
  if (m.exact) return route.path === m.to;
  return route.path === m.to || route.path.startsWith(m.to + "/");
}
function groupActive(m) {
  return (m.children || []).some((c) => isActive(c));
}
function toggle(m) {
  expanded[m.label] = !expanded[m.label];
}

async function load() {
  try { boards.value = await boardApi.list(); } catch (e) { boards.value = []; }
}
onMounted(load);
watch(() => route.path, (p) => { if (p.startsWith("/board") || p.startsWith("/post")) expanded.게시판 = true; }, { immediate: true });
</script>

<style scoped>
.side { width: 236px; flex-shrink: 0; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; color: #cbd5e1; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-right: 1px solid rgba(148, 163, 184, 0.12); transition: width 0.25s ease, transform 0.25s ease; }
.side.closed { width: 70px; }
.brand { height: 64px; display: flex; align-items: center; gap: 0.7rem; padding: 0 1rem; border-bottom: 1px solid rgba(148, 163, 184, 0.12); }
.mark { flex-shrink: 0; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 9px; font-weight: 800; font-size: 0.9rem; line-height: 1; color: #fff; letter-spacing: -0.5px; background: linear-gradient(145deg, #6366f1, #4f46e5 60%, #4338ca); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); }
.word { display: flex; flex-direction: column; line-height: 1.1; overflow: hidden; }
.word .ko { font-weight: 800; font-size: 1.05rem; color: #f1f5f9; letter-spacing: 0.02em; }
.word .sub { font-size: 0.66rem; color: #94a3b8; }

.menu { flex: 1; padding: 0.75rem 0.6rem; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.7rem; border-radius: 9px; color: rgba(203, 213, 225, 0.75); font-size: 0.9rem; font-weight: 500; text-decoration: none; position: relative; transition: background 0.15s, color 0.15s; cursor: pointer; }
.closed .item { justify-content: center; }
.item .ic { width: 20px; text-align: center; font-size: 0.95rem; color: rgba(148, 163, 184, 0.7); transition: color 0.15s; }
.item:hover { background: rgba(148, 163, 184, 0.1); color: #f1f5f9; }
.item:hover .ic { color: #cbd5e1; }
.item.on { background: rgba(79, 70, 229, 0.22); color: #fff; }
.item.on .ic { color: #a5b4fc; }
.item.on::before { content: ""; position: absolute; left: 0; top: 18%; bottom: 18%; width: 3px; border-radius: 0 3px 3px 0; background: #6366f1; }
.chev { margin-left: auto; font-size: 0.65rem; opacity: 0.5; transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }

.children { display: flex; flex-direction: column; gap: 1px; margin: 2px 0 4px 0.7rem; padding-left: 0.5rem; border-left: 1px solid rgba(148, 163, 184, 0.15); }
.child { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.6rem; border-radius: 8px; font-size: 0.85rem; color: rgba(203, 213, 225, 0.65); text-decoration: none; transition: background 0.14s, color 0.14s; }
.child .dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(148, 163, 184, 0.5); }
.child:hover { background: rgba(148, 163, 184, 0.08); color: #f1f5f9; }
.child.on { color: #fff; }
.child.on .dot { background: #6366f1; }
.child.empty { color: rgba(148, 163, 184, 0.35); cursor: default; }

.foot { padding: 0.9rem 1rem; font-size: 0.68rem; letter-spacing: 0.04em; color: rgba(148, 163, 184, 0.4); border-top: 1px solid rgba(148, 163, 184, 0.12); }
.side.mobile { position: fixed; left: 0; top: 0; z-index: 60; box-shadow: 0 0 40px rgba(0, 0, 0, 0.5); }
.side.mobile.closed { transform: translateX(-100%); width: 236px; }
</style>
