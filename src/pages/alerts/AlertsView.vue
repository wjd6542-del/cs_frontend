<template>
  <div class="page">
    <header class="phead">
      <div>
        <h1 class="ttl">{{ $t("미해결 응대 알림") }}</h1>
        <p class="desc">{{ $t("해결·종료되지 않은 응대(접수·처리중)를 모아 보여줍니다.") }}</p>
      </div>
      <button class="btn" @click="refresh"><i class="fa-solid fa-rotate-right"></i> {{ $t("새로고침") }}</button>
    </header>

    <!-- 요약 -->
    <div class="cards">
      <div class="card"><span class="lbl">{{ $t("전체 미해결") }}</span><strong class="val num">{{ store.total }}건</strong></div>
      <router-link to="/support/vendor" class="card link"><span class="lbl">{{ $t("🏪 업체 응대") }}</span><strong class="val num">{{ store.counts.VENDOR }}건</strong></router-link>
      <router-link to="/support/gameco" class="card link"><span class="lbl">{{ $t("🎮 게임사 응대") }}</span><strong class="val num">{{ store.counts.GAME_COMPANY }}건</strong></router-link>
      <router-link to="/support/solution" class="card link"><span class="lbl">{{ $t("🧩 솔루션 응대") }}</span><strong class="val num">{{ store.counts.SOLUTION }}건</strong></router-link>
    </div>

    <div v-if="!store.rows.length" class="listcard"><EmptyState icon="🔔" :title="$t('알림이 없어요!')" :desc="$t('처리할 미해결 응대가 없어요.')" :hint="$t('모두 해결됨 ✨')" /></div>
    <div v-else class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th class="c">{{ $t("구분") }}</th><th class="c">{{ $t("상태") }}</th><th class="c">{{ $t("우선") }}</th><th>{{ $t("대상") }}</th><th>{{ $t("제목") }}</th><th class="muted">{{ $t("등록") }}</th><th class="c w-act">{{ $t("이동") }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="t in store.rows" :key="t.id" class="row" @click="go(t)">
            <td class="c"><span class="badge" :class="partyClass(t.party)">{{ partyShort(t.party) }}</span></td>
            <td class="c"><span class="badge" :class="'st-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span></td>
            <td class="c"><span class="pri" :class="'p' + t.priority">{{ priLabel(t.priority) }}</span></td>
            <td class="nm">{{ t.vendor_name || t.game_company_name || t.solution_company_name || '-' }}</td>
            <td class="ti">{{ t.title }}<span v-if="t.message_count" class="cc">[{{ t.message_count }}]</span></td>
            <td class="muted xs num">{{ d(t.created_at) }}</td>
            <td class="c"><button class="btn btn-xs btn-primary" @click.stop="go(t)">{{ $t("바로가기 ›") }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAlertsStore } from "@/stores/alerts";
import EmptyState from "@/components/base/EmptyState.vue";

const router = useRouter();
const store = useAlertsStore();

function d(v) { return String(v).slice(0, 10); }
function statusLabel(s) { return { OPEN: "접수", IN_PROGRESS: "처리중" }[s] || s; }
function priLabel(p) { return ["보통", "높음", "긴급"][p] || "보통"; }
function partyShort(p) { return p === "VENDOR" ? "업체" : p === "GAME_COMPANY" ? "게임사" : "솔루션"; }
function partyClass(p) { return p === "VENDOR" ? "badge-in" : p === "GAME_COMPANY" ? "badge-info" : "badge-soln"; }
function go(t) {
  const path = t.party === "VENDOR" ? "/support/vendor" : t.party === "GAME_COMPANY" ? "/support/gameco" : "/support/solution";
  router.push({ path, query: { open: t.id } });
}
async function refresh() { await store.fetch(); }
onMounted(refresh);
</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; gap: 1rem; }
.eyebrow { font-family: var(--font-pixel); font-size: 0.66rem; letter-spacing: 0.16em; color: var(--seal); }
.ttl { font-family: var(--font-pixel); font-size: 1.35rem; color: var(--ink); margin-top: 0.25rem; }
.desc { font-size: 0.85rem; color: var(--ink-muted); margin-top: 0.2rem; }

.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
@media (max-width: 820px) { .cards { grid-template-columns: repeat(2, 1fr); } }
.card { background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.3rem; text-decoration: none; }
.card.link { transition: transform 0.08s, box-shadow 0.08s; }
.card.link:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--line-hard); }
.card .lbl { font-size: 0.76rem; color: var(--ink-muted); font-weight: 600; }
.card .val { font-size: 1.35rem; color: var(--ink); }
@media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }

.listcard { background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); }
.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.55rem 0.7rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-family: var(--font-pixel); font-weight: 600; font-size: 0.72rem; color: var(--ink-muted); }
.tbl td { padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--line); font-size: 0.86rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.row { cursor: pointer; } .row:hover { background: var(--surface-2); }
.c { text-align: center; } .nm { font-weight: 600; } .ti { font-weight: 600; } .muted { color: var(--ink-muted); } .xs { font-size: 0.74rem; }
.cc { color: var(--seal); font-weight: 700; margin-left: 0.3rem; font-size: 0.8rem; }
.w-act { width: 100px; }
.badge-soln { background: #e0f2f1; color: #0f766e; }
.st-open { background: #fef3c7; color: #b45309; }
.st-in_progress { background: #ede9ff; color: var(--seal-deep); }
.pri { font-family: var(--font-pixel); font-size: 0.66rem; }
.pri.p0 { color: var(--ink-faint); } .pri.p1 { color: #b45309; } .pri.p2 { color: var(--danger); }
</style>
