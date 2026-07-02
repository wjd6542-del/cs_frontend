<template>
  <div class="settings">
    <header class="phead">
      <p class="eyebrow">환경설정</p>
      <h1 class="ttl">환경설정</h1>
    </header>

    <div class="tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ on: active === t.key }"
        role="tab"
        @click="active = t.key"
      >
        <i class="fa-solid" :class="t.icon"></i>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <div class="panel">
      <p v-if="activeTab?.desc" class="pdesc">{{ activeTab.desc }}</p>
      <component :is="activeTab.comp" v-if="activeTab?.comp" />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, markRaw } from "vue";
import GameCompanySettings from "@/pages/settings/GameCompanySettings.vue";
import VendorSettings from "@/pages/settings/VendorSettings.vue";
import BoardSettings from "@/pages/settings/BoardSettings.vue";
import FaqCategorySettings from "@/pages/settings/FaqCategorySettings.vue";
import TagSettings from "@/pages/settings/TagSettings.vue";
import AccountSettings from "@/pages/settings/AccountSettings.vue";

const tabs = [
  { key: "gameco", label: "게임사", icon: "fa-gamepad", comp: markRaw(GameCompanySettings), desc: "사용료를 지급하는 게임사를 등록·관리합니다. 정산·응대에서 이 목록을 사용합니다." },
  { key: "vendor", label: "업체", icon: "fa-store", comp: markRaw(VendorSettings), desc: "사용대금을 회수하는 업체를 등록·관리합니다." },
  { key: "board", label: "게시판", icon: "fa-clipboard-list", comp: markRaw(BoardSettings), desc: "게시판을 만들고 권한(읽기/쓰기)·댓글·첨부 허용을 설정합니다." },
  { key: "faqcat", label: "FAQ 분류", icon: "fa-tags", comp: markRaw(FaqCategorySettings), desc: "자주 하는 질문의 분류를 등록·관리합니다. FAQ 작성 시 이 분류를 선택합니다." },
  { key: "tag", label: "태그", icon: "fa-tag", comp: markRaw(TagSettings), desc: "CS 응대·FAQ에 붙이는 공통 태그를 등록·관리합니다. 검색 중 없으면 즉시 만들 수도 있습니다." },
  { key: "account", label: "계정·권한", icon: "fa-users-gear", comp: markRaw(AccountSettings), desc: "계정을 만들고 역할별 권한을 지정합니다." },
];

const active = ref("gameco");
const activeTab = computed(() => tabs.find((t) => t.key === active.value));
</script>

<style scoped>
.settings { max-width: 1000px; margin: 0 auto; }
.phead { margin-bottom: 1.1rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); text-transform: uppercase; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--ink); margin-top: 0.25rem; }

.tabs { display: flex; gap: 0.35rem; border-bottom: 2px solid var(--line); margin-bottom: 1.25rem; flex-wrap: wrap; }
.tab { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.6rem 1rem; margin-bottom: -2px; border-bottom: 2px solid transparent; font-size: 0.9rem; font-weight: 600; color: var(--ink-muted); transition: color 0.15s, border-color 0.15s; }
.tab:hover { color: var(--ink); }
.tab.on { color: var(--seal); border-bottom-color: var(--seal); font-weight: 700; }
.tab i { font-size: 0.85rem; }
.pdesc { font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 1rem; }
</style>
