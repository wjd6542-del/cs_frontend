<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">환율 정보</p>
        <h1 class="ttl">환율 정보</h1>
        <p class="desc">기준 통화 <b>원(KRW)</b> · 매일 자동 수집 · 표기: 외화 1{{ '' }}단위 = 원</p>
      </div>
      <div class="hbtns">
        <button class="btn btn-primary" @click="openCalc"><i class="fa-solid fa-calculator"></i> 환율 계산기</button>
        <button class="btn" @click="refresh"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
      </div>
    </header>

    <!-- 최신 환율 카드 -->
    <div class="cards">
      <div v-for="c in CUR" :key="c.key" class="rcard pcard">
        <div class="rc-top">
          <span class="flag">{{ c.emoji }}</span>
          <div class="rc-meta"><div class="rc-name">{{ c.label }}</div><div class="rc-code">{{ c.unit > 1 ? c.unit + c.symbol : c.symbol }}</div></div>
        </div>
        <div class="rc-val num">{{ latest ? won(disp(latest[c.key], c.unit)) : "—" }}</div>
      </div>
    </div>
    <p v-if="latest" class="asof num">기준일 {{ d(latest.date) }}</p>

    <!-- 이력 -->
    <h3 class="sub">환율 이력</h3>
    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="num">일자</th>
            <th v-for="c in CUR" :key="c.key" class="r">{{ c.emoji }} {{ c.unit > 1 ? c.unit + c.symbol : c.symbol }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td :colspan="CUR.length + 1"><EmptyState icon="💱" title="환율 이력이 없어요" desc="자동 수집을 기다리거나 새로고침 하세요." hint="매일 자동 수집" compact /></td></tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="num dt">{{ d(r.date) }}</td>
            <td v-for="c in CUR" :key="c.key" class="r num">{{ won(disp(r[c.key], c.unit)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reload" />

    <!-- 환율 계산기 모달 -->
    <div v-if="calcOpen" class="drawer" @click.self="calcOpen = false">
      <div class="cmodal">
        <button class="vclose" @click="calcOpen = false"><i class="fa-solid fa-xmark"></i></button>
        <h3 class="cttl"><i class="fa-solid fa-calculator"></i> 환율 계산기</h3>
        <p class="csub">원화 기준 · 선택한 일자의 환율로 계산됩니다</p>

        <div class="crow">
          <label class="cfld">
            <span class="clbl">기준일</span>
            <SearchSelect v-model="calc.dateId" :options="dateOptions" placeholder="일자 선택" search-placeholder="일자 검색…" />
          </label>
          <label class="cfld">
            <span class="clbl">통화</span>
            <SearchSelect v-model="calc.cur" :options="curOptions" placeholder="통화 선택" search-placeholder="통화 검색…" />
          </label>
        </div>

        <div class="conv">
          <div class="cbox">
            <span class="ccap">{{ calc.dir === 'toKrw' ? curLabel : '원 (KRW)' }}</span>
            <input v-model="calc.amount" type="number" class="camt" placeholder="0" />
          </div>
          <button class="swap" @click="swapDir" title="방향 전환"><i class="fa-solid fa-right-left"></i></button>
          <div class="cbox result">
            <span class="ccap">{{ calc.dir === 'toKrw' ? '원 (KRW)' : curLabel }}</span>
            <div class="cres num">{{ resultText }}</div>
          </div>
        </div>

        <p v-if="rate" class="crate num">💱 1 {{ curSymbol }} = {{ won(rate) }} <span class="crated">({{ dateLabel }})</span></p>
        <p v-else class="crate warn">선택한 일자의 {{ curSymbol }} 환율이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import Pager from "@/components/base/Pager.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { exchangeRateApi } from "@/api/cs";

const CUR = [
  { key: "usd", label: "미국 달러", emoji: "🇺🇸", symbol: "USD", unit: 1 },
  { key: "jpy", label: "일본 엔", emoji: "🇯🇵", symbol: "JPY", unit: 100 },
  { key: "cny", label: "중국 위안", emoji: "🇨🇳", symbol: "CNY", unit: 1 },
  { key: "vnd", label: "베트남 동", emoji: "🇻🇳", symbol: "VND", unit: 100 },
  { key: "eur", label: "유로", emoji: "🇪🇺", symbol: "EUR", unit: 1 },
  { key: "gbp", label: "영국 파운드", emoji: "🇬🇧", symbol: "GBP", unit: 1 },
];

const toast = useToast();
const latest = ref(null);
const rows = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);

function d(v) { return String(v).slice(0, 10); }
function disp(v, unit) { return v == null ? null : v * unit; }
function won(n) {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 3;
  return n.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "원";
}

async function reload() {
  const res = await exchangeRateApi.list({ page: page.value, limit: 30 });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 1;
}
async function loadLatest() { latest.value = await exchangeRateApi.latest(); }

/* ── 계산기 ── */
const calcOpen = ref(false);
const calc = reactive({ dateId: null, cur: "usd", amount: "", dir: "toKrw" });
const dateOptions = computed(() => rows.value.map((r) => ({ value: r.id, label: d(r.date) })));
const curOptions = computed(() => CUR.map((c) => ({ value: c.key, label: `${c.emoji} ${c.label} (${c.symbol})` })));
const rateRow = computed(() => rows.value.find((r) => r.id === calc.dateId) || latest.value);
const rate = computed(() => (rateRow.value ? rateRow.value[calc.cur] : null));
const curMeta = computed(() => CUR.find((c) => c.key === calc.cur) || CUR[0]);
const curLabel = computed(() => `${curMeta.value.emoji} ${curMeta.value.symbol}`);
const curSymbol = computed(() => curMeta.value.symbol);
const dateLabel = computed(() => (rateRow.value ? d(rateRow.value.date) : "-"));
const result = computed(() => {
  const amt = Number(calc.amount);
  if (!rate.value || !isFinite(amt) || calc.amount === "") return null;
  return calc.dir === "toKrw" ? amt * rate.value : amt / rate.value;
});
const resultText = computed(() => {
  if (result.value == null) return "—";
  if (calc.dir === "toKrw") return won(result.value);
  return result.value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + " " + curSymbol.value;
});
function openCalc() {
  calc.dateId = latest.value?.id ?? rows.value[0]?.id ?? null;
  calc.cur = "usd"; calc.amount = ""; calc.dir = "toKrw";
  calcOpen.value = true;
}
function swapDir() { calc.dir = calc.dir === "toKrw" ? "toCur" : "toKrw"; }
async function refresh() {
  try { await exchangeRateApi.collect(); toast.success("최신 환율을 수집했습니다."); }
  catch (e) { toast.error(e?.message || "수집 실패"); }
  await Promise.all([loadLatest(), (page.value = 1, reload())]);
}
onMounted(async () => { await Promise.all([loadLatest(), reload()]); });
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; gap: 1rem; }
.eyebrow { font-family: var(--font-pixel); font-size: 0.66rem; letter-spacing: 0.16em; color: var(--seal); }
.ttl { font-family: var(--font-pixel); font-size: 1.35rem; color: var(--ink); margin-top: 0.25rem; }
.desc { font-size: 0.84rem; color: var(--ink-muted); margin-top: 0.2rem; }

.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.7rem; }
@media (max-width: 900px) { .cards { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 520px) { .cards { grid-template-columns: repeat(2, 1fr); } }
.rcard { padding: 0.8rem 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
.rc-top { display: flex; align-items: center; gap: 0.5rem; }
.flag { font-size: 1.4rem; line-height: 1; }
.rc-name { font-size: 0.78rem; font-weight: 700; color: var(--ink); }
.rc-code { font-family: var(--font-pixel); font-size: 0.58rem; color: var(--ink-faint); }
.rc-val { font-size: 1.15rem; font-weight: 800; color: var(--seal-deep); }
.asof { margin-top: 0.6rem; font-size: 0.74rem; color: var(--ink-faint); }

.sub { font-family: var(--font-pixel); font-size: 0.9rem; color: var(--ink); margin: 1.4rem 0 0.7rem; }
.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow-x: auto; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; min-width: 640px; }
.tbl th { text-align: left; padding: 0.55rem 0.7rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-family: var(--font-pixel); font-size: 0.66rem; color: var(--ink-muted); white-space: nowrap; }
.tbl td { padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--line); font-size: 0.85rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.r { text-align: right; } .dt { font-weight: 700; }
.hbtns { display: flex; gap: 0.5rem; }

/* 계산기 모달 */
.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(27, 29, 46, 0.55); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.cmodal { position: relative; width: 440px; max-width: 100%; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-lg); padding: 1.5rem; }
.vclose { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border: 2px solid var(--line-hard); border-radius: 3px; color: var(--ink); box-shadow: 2px 2px 0 var(--line-hard); }
.vclose:hover { background: var(--surface-2); }
.cttl { font-family: var(--font-pixel); font-size: 1.1rem; color: var(--ink); display: flex; align-items: center; gap: 0.5rem; }
.cttl i { color: var(--seal); }
.csub { font-size: 0.8rem; color: var(--ink-muted); margin-top: 0.3rem; margin-bottom: 1.1rem; }
.crow { display: flex; gap: 0.7rem; margin-bottom: 1rem; }
.cfld { flex: 1; display: block; }
.clbl { display: block; font-family: var(--font-pixel); font-size: 0.64rem; color: var(--ink-soft); margin-bottom: 0.35rem; }

.conv { display: flex; align-items: stretch; gap: 0.6rem; }
.cbox { flex: 1; min-width: 0; background: var(--surface-2); border: 2px solid var(--line-hard); border-radius: 3px; padding: 0.6rem 0.7rem; display: flex; flex-direction: column; gap: 0.3rem; }
.cbox.result { background: #ede9ff; }
.ccap { font-family: var(--font-pixel); font-size: 0.6rem; color: var(--ink-muted); }
.camt { width: 100%; background: transparent; border: none; outline: none; font-family: var(--font-pixel); font-size: 1.05rem; color: var(--ink); }
.cres { font-family: var(--font-pixel); font-size: 1.05rem; color: var(--seal-deep); word-break: break-all; }
.swap { flex-shrink: 0; width: 38px; align-self: center; height: 38px; border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface); color: var(--seal); box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s; }
.swap:hover { transform: translateY(-1px); }
.swap:active { transform: translateY(1px); }
.crate { margin-top: 1.1rem; text-align: center; font-size: 0.85rem; color: var(--ink); }
.crate .crated { color: var(--ink-faint); font-size: 0.76rem; }
.crate.warn { color: var(--danger); }
</style>
