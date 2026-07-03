<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">정산 관리</p>
        <h1 class="ttl">{{ isVendor ? "업체 정산" : "게임사 정산" }}</h1>
        <p class="desc">{{ isVendor ? "업체별 사용대금 회수 정산을 관리합니다." : "게임사별 사용료 지급 정산을 관리합니다." }}</p>
      </div>
      <button v-if="canEdit" class="btn btn-primary" @click="openNew()">+ 정산 등록</button>
    </header>

    <div class="filterbar">
      <div class="w-72 shrink-0"><DateRangePicker v-model="dateRange" mode="date" :show-quick-buttons="true" placeholder="정산 기간 선택" @change="onDateChange" /></div>
      <div class="w-36 shrink-0"><SearchSelect v-model="filter.status" :options="STATUS_OPTS" placeholder="전체 상태" @change="search" /></div>
      <div class="w-52 shrink-0"><SearchSelect
        class="!w-52"
        v-model="filter.party_id"
        :options="parties"
        label-key="name"
        value-key="id"
        :placeholder="isVendor ? '전체 업체' : '전체 게임사'"
        search-placeholder="이름 검색…"
        @change="search"
      /></div>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ isVendor ? "업체" : "게임사" }}</th><th>기간</th>
            <th class="r">정산액</th><th class="r">{{ isVendor ? "회수액" : "지급액" }}</th><th class="r">잔액</th>
            <th class="c">상태</th><th class="c w-act">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td colspan="7"><EmptyState variant="settlement" compact /></td></tr>
          <tr v-for="s in rows" :key="s.id">
            <td class="nm">{{ s.vendor_name || s.game_company_name || "-" }}</td>
            <td class="muted">{{ d(s.period_start) }} ~ {{ d(s.period_end) }}</td>
            <td class="r">{{ won(s.amount) }}</td>
            <td class="r pos">{{ won(s.settled_amount) }}</td>
            <td class="r" :class="s.remaining > 0 ? 'neg' : 'muted'">{{ won(s.remaining) }}</td>
            <td class="c"><span class="tag" :class="s.status.toLowerCase()">{{ statusLabel(s.status) }}</span></td>
            <td class="c">
              <template v-if="canEdit">
                <button v-if="s.status !== 'DONE'" class="btn btn-xs btn-primary" @click="openSettle(s)">{{ isVendor ? "입금처리" : "지급처리" }}</button>
                <button class="btn btn-xs" @click="openEdit(s)">수정</button>
                <button class="btn btn-xs btn-danger" @click="remove(s)">삭제</button>
              </template>
              <span v-else class="muted xs">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reload" />

    <!-- 등록/수정 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "정산 수정" : "정산 등록" }}</h4>
        <div class="grid">
          <label class="fld col2">
            <span class="form-label">{{ isVendor ? "업체" : "게임사" }}</span>
            <SearchSelect v-model="form.party_id" :options="parties" label-key="name" value-key="id" placeholder="선택하세요" search-placeholder="이름 검색…" />
          </label>
          <label class="fld col2">
            <span class="form-label">정산 월 <span class="hint">· 선택하면 1일~말일 자동</span></span>
            <input type="month" v-model="form.period_month" class="field" @change="applyMonth" />
          </label>
          <BaseInput v-model="form.period_start" label="기간 시작" type="date" />
          <BaseInput v-model="form.period_end" label="기간 종료" type="date" />
          <BaseInput v-model="form.amount" label="정산 금액(원)" type="number" />
          <label class="fld col2">
            <span class="form-label">메모</span>
            <textarea v-model="form.memo" class="field-auto" rows="2"></textarea>
          </label>
        </div>
        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="acts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? "저장 중…" : "저장" }}</button>
          <button class="btn" @click="showForm = false">취소</button>
        </div>
      </div>
    </div>

    <!-- 처리 -->
    <div v-if="showSettle" class="drawer" @click.self="showSettle = false">
      <div class="panel sm">
        <h4 class="ph">{{ isVendor ? "입금 처리" : "지급 처리" }}</h4>
        <p class="settle-info">
          <b>{{ settleTarget?.vendor_name || settleTarget?.game_company_name }}</b><br />
          정산액 {{ won(settleTarget?.amount) }} · 잔액 <b class="neg">{{ won(settleTarget?.remaining) }}</b>
        </p>
        <div class="grid">
          <BaseInput v-model="settleForm.amount" :label="`${isVendor ? '회수' : '지급'} 금액(원)`" type="number" />
          <BaseInput v-model="settleForm.entry_date" label="처리 일자" type="date" />
        </div>
        <p class="hint">처리 시 장부에 {{ isVendor ? "회수" : "지급" }} 거래가 자동 기록됩니다.</p>
        <p v-if="settleMsg" class="msg err">{{ settleMsg }}</p>
        <div class="acts">
          <button class="btn btn-primary" :disabled="settling" @click="doSettle">{{ settling ? "처리 중…" : "처리" }}</button>
          <button class="btn" @click="showSettle = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import BaseInput from "@/components/base/BaseInput.vue";
import Pager from "@/components/base/Pager.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import { settlementApi, gameCompanyApi, vendorApi } from "@/api/cs";
import { formatDateOnly } from "@/utils/date";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const canEdit = computed(() => auth.hasPermission("settlement.edit"));

const props = defineProps({ type: { type: String, default: "VENDOR" } });
const isVendor = computed(() => props.type === "VENDOR");
const toast = useToast();

const LIMIT = 15;
const STATUS_OPTS = [
  { value: "PENDING", label: "대기", color: "#f59e0b" },
  { value: "PARTIAL", label: "부분정산", color: "#7a5cff" },
  { value: "DONE", label: "완료", color: "#0ea88f" },
];
const rows = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const parties = ref([]);
const filter = reactive({ status: "", party_id: "", date_from: "", date_to: "" });
const dateRange = ref({ start: null, end: null });

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, party_id: null, period_month: currentMonth(), period_start: firstOfMonth(), period_end: lastOfMonth(), amount: "", memo: "" });

const showSettle = ref(false);
const settling = ref(false);
const settleMsg = ref("");
const settleTarget = ref(null);
const settleForm = reactive({ amount: "", entry_date: today() });

function today() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() { const dt = new Date(); return new Date(dt.getFullYear(), dt.getMonth(), 1).toLocaleDateString("sv-SE"); }
function lastOfMonth() { const dt = new Date(); return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).toLocaleDateString("sv-SE"); }
function currentMonth() { const dt = new Date(); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; }
function monthRange(m) {
  const [y, mo] = m.split("-").map(Number);
  const last = new Date(y, mo, 0).getDate();
  return { start: `${m}-01`, end: `${m}-${String(last).padStart(2, "0")}` };
}
function applyMonth() {
  if (!form.period_month) return;
  const { start, end } = monthRange(form.period_month);
  form.period_start = start;
  form.period_end = end;
}
function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }
function d(v) { return String(v).slice(0, 10); }
function statusLabel(s) { return { PENDING: "대기", PARTIAL: "부분정산", DONE: "완료" }[s] || s; }

async function reload() {
  const body = { type: props.type, page: page.value, limit: LIMIT };
  if (filter.status) body.status = filter.status;
  if (filter.party_id) body[isVendor.value ? "vendor_id" : "game_company_id"] = filter.party_id;
  if (filter.date_from) body.date_from = filter.date_from;
  if (filter.date_to) body.date_to = filter.date_to;
  const res = await settlementApi.list(body);
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 1;
}
function search() { page.value = 1; reload(); }
function onDateChange(r) {
  filter.date_from = r?.start ? formatDateOnly(r.start) : "";
  filter.date_to = r?.end ? formatDateOnly(r.end) : "";
  search();
}
async function loadParties() {
  parties.value = isVendor.value ? await vendorApi.options() : await gameCompanyApi.options();
}
function openNew() {
  editing.value = false;
  const m = currentMonth();
  const { start, end } = monthRange(m);
  Object.assign(form, { id: null, party_id: null, period_month: m, period_start: start, period_end: end, amount: "", memo: "" });
  msg.value = ""; showForm.value = true;
}
function openEdit(s) {
  editing.value = true;
  Object.assign(form, { id: s.id, party_id: isVendor.value ? s.vendor_id : s.game_company_id, period_month: d(s.period_start).slice(0, 7), period_start: d(s.period_start), period_end: d(s.period_end), amount: s.amount, memo: s.memo || "" });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await settlementApi.save({
      id: form.id || undefined,
      type: props.type,
      vendor_id: isVendor.value ? form.party_id : null,
      game_company_id: isVendor.value ? null : form.party_id,
      period_start: form.period_start, period_end: form.period_end,
      amount: Number(form.amount), memo: form.memo || null,
    });
    toast.success("저장되었습니다."); showForm.value = false; await reload();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
function openSettle(s) {
  settleTarget.value = s;
  Object.assign(settleForm, { amount: s.remaining, entry_date: today() });
  settleMsg.value = ""; showSettle.value = true;
}
async function doSettle() {
  settleMsg.value = ""; settling.value = true;
  try {
    await settlementApi.settle({ id: settleTarget.value.id, amount: Number(settleForm.amount), entry_date: settleForm.entry_date });
    toast.success("처리되었습니다."); showSettle.value = false; await reload();
  } catch (e) { settleMsg.value = e?.message || "처리 실패"; }
  finally { settling.value = false; }
}
async function remove(s) {
  if (!await confirmDelete("이 정산을 삭제할까요?")) return;
  try { await settlementApi.remove(s.id); toast.success("삭제되었습니다."); await reload(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}

watch(() => props.type, async () => { filter.status = ""; filter.party_id = ""; page.value = 1; await Promise.all([reload(), loadParties()]); });
onMounted(async () => { await Promise.all([reload(), loadParties()]); });
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; gap: 1rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); text-transform: uppercase; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--ink); margin-top: 0.25rem; }
.desc { font-size: 0.85rem; color: var(--ink-muted); margin-top: 0.2rem; }
.filters { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }

.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-weight: 600; font-family: var(--font-pixel); font-size: 0.78rem; color: var(--ink-muted); }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.r { text-align: right; } .c { text-align: center; }
.w-act { width: 190px; }
.nm { font-weight: 700; } .muted { color: var(--ink-muted); }
.pos { color: var(--flow-in); } .neg { color: #dc2626; }
.state { text-align: center; padding: 1.6rem 0; color: var(--ink-faint); }
.tag { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; }
.tag.pending { color: #b45309; background: #fef3c7; }
.tag.partial { color: #4f46e5; background: #e0e7ff; }
.tag.done { color: #047857; background: var(--flow-in-bg); }
.btn-xs + .btn-xs { margin-left: 0.3rem; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 520px; max-width: 100%; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.panel.sm { width: 420px; }
.ph { font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; } .col2 { grid-column: 1 / -1; }
.settle-info { font-size: 0.9rem; color: var(--ink); background: var(--surface-2); border-radius: 3px; padding: 0.7rem 0.9rem; margin-bottom: 0.9rem; line-height: 1.5; }
.hint { font-size: 0.76rem; color: var(--ink-muted); margin-top: 0.6rem; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: #dc2626; }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
</style>
