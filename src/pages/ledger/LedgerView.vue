<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">정산 관리</p>
        <h1 class="ttl">장부 관리</h1>
      </div>
      <button class="btn btn-primary" @click="openNew()">+ 거래 등록</button>
    </header>

    <!-- 요약 -->
    <div class="cards">
      <div class="card pay">
        <span class="lbl">지급 합계 (게임사)</span>
        <strong class="val">{{ won(totals.PAYMENT) }}</strong>
      </div>
      <div class="card col">
        <span class="lbl">회수 합계 (업체)</span>
        <strong class="val">{{ won(totals.COLLECTION) }}</strong>
      </div>
      <div class="card net">
        <span class="lbl">차액 (회수 − 지급)</span>
        <strong class="val" :class="net >= 0 ? 'pos' : 'neg'">{{ won(net) }}</strong>
      </div>
    </div>

    <!-- 필터 -->
    <div class="filterbar">
      <div class="w-32 shrink-0"><SearchSelect v-model="filter.type" :options="TYPE_OPTS" placeholder="전체 구분" @change="search" /></div>
      <div class="w-72 shrink-0"><DateRangePicker v-model="dateRange" mode="date" :show-quick-buttons="true" placeholder="거래 기간 선택" @change="onDateChange" /></div>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th>일자</th><th class="c">구분</th><th>대상</th><th class="r">금액</th><th>메모</th><th class="c w-act">관리</th></tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td colspan="6"><EmptyState variant="ledger" compact /></td></tr>
          <tr v-for="e in rows" :key="e.id">
            <td>{{ d(e.entry_date) }}</td>
            <td class="c"><span class="tag" :class="e.type === 'PAYMENT' ? 'pay' : 'col'">{{ e.type === 'PAYMENT' ? '지급' : '회수' }}</span></td>
            <td>{{ e.game_company_name || e.vendor_name || "-" }}</td>
            <td class="r amt" :class="e.type === 'PAYMENT' ? 'neg' : 'pos'">{{ won(e.amount) }}</td>
            <td class="muted">{{ e.memo || "-" }}<span v-if="e.settlement_id" class="badge badge-indigo ml">정산#{{ e.settlement_id }}</span></td>
            <td class="c">
              <template v-if="!e.settlement_id">
                <button class="btn btn-xs" @click="openEdit(e)">수정</button>
                <button class="btn btn-xs btn-danger" @click="remove(e)">삭제</button>
              </template>
              <span v-else class="muted xs">정산 파생</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reload" />

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "거래 수정" : "거래 등록" }}</h4>
        <div class="grid">
          <label class="fld">
            <span class="form-label">구분</span>
            <SearchSelect v-model="form.type" :options="TYPE_FORM_OPTS" @change="onTypeChange" />
          </label>
          <label class="fld">
            <span class="form-label">{{ form.type === 'PAYMENT' ? '게임사' : '업체' }}</span>
            <SearchSelect v-model="form.party_id" :options="partyOptions" label-key="name" value-key="id" placeholder="선택하세요" search-placeholder="이름 검색…" />
          </label>
          <BaseInput v-model="form.entry_date" label="일자" type="date" />
          <BaseInput v-model="form.amount" label="금액(원)" type="number" />
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
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import BaseInput from "@/components/base/BaseInput.vue";
import Pager from "@/components/base/Pager.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import DateRangePicker from "@/components/base/DateRangePicker.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { formatDateOnly } from "@/utils/date";
import { ledgerApi, gameCompanyApi, vendorApi } from "@/api/cs";

const LIMIT = 15;
const TYPE_OPTS = [{ value: "PAYMENT", label: "지급" }, { value: "COLLECTION", label: "회수" }];
const TYPE_FORM_OPTS = [{ value: "PAYMENT", label: "지급 (게임사에 사용료)" }, { value: "COLLECTION", label: "회수 (업체에서 사용대금)" }];
const toast = useToast();
const rows = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const totals = reactive({ PAYMENT: 0, COLLECTION: 0 });
const net = computed(() => totals.COLLECTION - totals.PAYMENT);
const filter = reactive({ type: "", date_from: "", date_to: "" });
const dateRange = ref({ start: null, end: null });

function onDateChange() {
  const r = dateRange.value || {};
  filter.date_from = r.start ? formatDateOnly(r.start) : "";
  filter.date_to = r.end ? formatDateOnly(r.end) : "";
  search();
}

const gamecos = ref([]);
const vendors = ref([]);
const partyOptions = computed(() => (form.type === "PAYMENT" ? gamecos.value : vendors.value));

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, type: "PAYMENT", party_id: null, entry_date: today(), amount: "", memo: "" });

function today() { const dt = new Date(); return dt.toISOString().slice(0, 10); }
function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }
function d(v) { return String(v).slice(0, 10); }

async function reload() {
  const res = await ledgerApi.list({ type: filter.type || undefined, date_from: filter.date_from || undefined, date_to: filter.date_to || undefined, page: page.value, limit: LIMIT });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 1;
  totals.PAYMENT = res.totals?.PAYMENT || 0;
  totals.COLLECTION = res.totals?.COLLECTION || 0;
}
function search() { page.value = 1; reload(); }
async function loadParties() {
  [gamecos.value, vendors.value] = await Promise.all([gameCompanyApi.options(), vendorApi.options()]);
}
function onTypeChange() { form.party_id = null; }
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, type: "PAYMENT", party_id: null, entry_date: today(), amount: "", memo: "" });
  msg.value = ""; showForm.value = true;
}
function openEdit(e) {
  editing.value = true;
  Object.assign(form, { id: e.id, type: e.type, party_id: e.type === "PAYMENT" ? e.game_company_id : e.vendor_id, entry_date: d(e.entry_date), amount: e.amount, memo: e.memo || "" });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await ledgerApi.save({
      id: form.id || undefined,
      type: form.type,
      entry_date: form.entry_date,
      amount: Number(form.amount),
      game_company_id: form.type === "PAYMENT" ? form.party_id : null,
      vendor_id: form.type === "COLLECTION" ? form.party_id : null,
      memo: form.memo || null,
    });
    toast.success("저장되었습니다."); showForm.value = false; await reload();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function remove(e) {
  if (!await confirmDelete("이 거래를 삭제할까요?")) return;
  try { await ledgerApi.remove(e.id); toast.success("삭제되었습니다."); await reload(); }
  catch (err) { toast.error(err?.message || "삭제 실패"); }
}
onMounted(async () => { await Promise.all([reload(), loadParties()]); });
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); text-transform: uppercase; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--ink); margin-top: 0.25rem; }

.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin-bottom: 1.1rem; }
.card { background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.35rem; }
.card .lbl { font-size: 0.76rem; color: var(--ink-muted); font-weight: 600; }
.card .val { font-size: 1.35rem; font-weight: 800; color: var(--ink); }
.val.pos { color: var(--flow-in); } .val.neg { color: #dc2626; }

.filters { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; }
.tilde { color: var(--ink-faint); }

.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-weight: 600; font-family: var(--font-pixel); font-size: 0.78rem; color: var(--ink-muted); }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.r { text-align: right; } .c { text-align: center; }
.w-act { width: 120px; }
.amt { font-weight: 700; } .amt.pos { color: var(--flow-in); } .amt.neg { color: #dc2626; }
.muted { color: var(--ink-muted); } .xs { font-size: 0.72rem; } .ml { margin-left: 0.4rem; }
.state { text-align: center; padding: 1.6rem 0; color: var(--ink-faint); }
.tag { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; }
.tag.pay { color: #dc2626; background: #fee2e2; }
.tag.col { color: var(--flow-in); background: var(--flow-in-bg); }
.btn-xs + .btn-xs { margin-left: 0.3rem; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 520px; max-width: 100%; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; } .col2 { grid-column: 1 / -1; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: #dc2626; }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
@media (max-width: 720px) { .cards { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr; } }
</style>
