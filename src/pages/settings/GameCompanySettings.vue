<template>
  <div>
    <div class="head">
      <h3 class="h">게임사 <span class="c">{{ total }}</span></h3>
      <div class="tools">
        <input v-model="q" class="field !w-48" placeholder="게임사·코드 검색" @keyup.enter="search" />
        <button class="btn btn-primary" @click="openNew">+ 게임사 추가</button>
      </div>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th>게임사명</th><th>이메일</th><th class="r">요율</th><th class="c">상태</th><th class="c w-act">관리</th></tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td colspan="5" class="state">게임사가 없습니다.</td></tr>
          <tr v-for="g in rows" :key="g.id">
            <td class="nm">{{ g.name }}</td>
            <td class="muted">{{ g.contact_email || "-" }}</td>
            <td class="r">{{ g.fee_rate != null ? g.fee_rate + "%" : "-" }}</td>
            <td class="c"><span class="st" :class="g.is_active ? 'on' : 'off'">{{ g.is_active ? "사용" : "중지" }}</span></td>
            <td class="c">
              <button class="btn btn-xs" @click="openEdit(g)">수정</button>
              <button class="btn btn-xs btn-danger" @click="remove(g)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reload" />

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "게임사 수정" : "게임사 추가" }}</h4>
        <div class="grid">
          <BaseInput v-model="form.name" label="게임사명" />
          <BaseInput v-model="form.contact_email" label="이메일" />
          <BaseInput v-model="form.fee_rate" label="요율(%)" type="number" placeholder="예: 15" />
          <label class="fld col2">
            <span class="form-label">메모</span>
            <textarea v-model="form.memo" class="field-auto" rows="2"></textarea>
          </label>
          <label class="fld toggle">
            <span class="form-label">상태</span>
            <span class="sw" :class="{ on: form.is_active }" @click="form.is_active = !form.is_active"><span class="knob"></span></span>
            <span class="sh">{{ form.is_active ? "사용" : "중지" }}</span>
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
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import Pager from "@/components/base/Pager.vue";
import { gameCompanyApi } from "@/api/cs";

const LIMIT = 15;
const toast = useToast();
const rows = ref([]);
const total = ref(0);
const totalPages = ref(1);
const page = ref(1);
const q = ref("");

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, name: "", code: "", contact_name: "", contact_phone: "", contact_email: "", fee_rate: "", memo: "", is_active: true });

async function reload() {
  const res = await gameCompanyApi.list({ q: q.value || undefined, page: page.value, limit: LIMIT });
  rows.value = res.rows || [];
  total.value = res.total ?? rows.value.length;
  totalPages.value = res.totalPages || 1;
}
function search() { page.value = 1; reload(); }
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, name: "", code: "", contact_name: "", contact_phone: "", contact_email: "", fee_rate: "", memo: "", is_active: true });
  msg.value = ""; showForm.value = true;
}
function openEdit(g) {
  editing.value = true;
  Object.assign(form, { id: g.id, name: g.name, code: g.code || "", contact_name: g.contact_name || "", contact_phone: g.contact_phone || "", contact_email: g.contact_email || "", fee_rate: g.fee_rate ?? "", memo: g.memo || "", is_active: !!g.is_active });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await gameCompanyApi.save({
      id: form.id || undefined,
      name: form.name, code: form.code || null,
      contact_name: form.contact_name || null, contact_phone: form.contact_phone || null, contact_email: form.contact_email || null,
      fee_rate: form.fee_rate === "" ? null : Number(form.fee_rate),
      memo: form.memo || null, is_active: form.is_active,
    });
    toast.success("저장되었습니다."); showForm.value = false; await reload();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function remove(g) {
  if (!confirm(`'${g.name}' 게임사를 삭제할까요?`)) return;
  try { await gameCompanyApi.remove(g.id); toast.success("삭제되었습니다."); await reload(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(reload);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
.h { font-weight: 700; color: var(--ink); }
.c { color: var(--seal); }
.tools { display: flex; gap: 0.5rem; align-items: center; }
.tablewrap { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--surface); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 1px solid var(--line); font-weight: 600; font-size: 0.78rem; color: var(--ink-muted); }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.r { text-align: right; }
.c { text-align: center; }
.w-act { width: 120px; }
.nm { font-weight: 700; }
.muted { color: var(--ink-muted); }
.state { text-align: center; padding: 1.6rem 0; color: var(--ink-faint); }
.st { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; }
.st.on { color: #047857; background: #d1fae5; }
.st.off { color: #64748b; background: #f1f5f9; }
.btn-xs + .btn-xs { margin-left: 0.3rem; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 520px; max-width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; }
.col2 { grid-column: 1 / -1; }
.toggle { display: flex; align-items: center; gap: 0.6rem; }
.toggle .form-label { margin-bottom: 0; }
.sw { width: 44px; height: 24px; border-radius: 999px; background: #cbd5e1; position: relative; cursor: pointer; transition: background 0.18s; }
.sw.on { background: #059669; }
.sw .knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.sh { font-size: 0.78rem; color: var(--ink-muted); }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; }
.msg.err { color: #dc2626; }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
