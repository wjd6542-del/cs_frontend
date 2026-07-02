<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">CS 관리</p>
        <h1 class="ttl">{{ isVendor ? "업체 응대" : "게임사 응대" }}</h1>
      </div>
      <button class="btn btn-primary" @click="openNew()">+ 응대 등록</button>
    </header>

    <div class="filters">
      <select v-model="filter.status" class="field !w-36" @change="reload">
        <option value="">전체 상태</option>
        <option value="OPEN">접수</option>
        <option value="IN_PROGRESS">처리중</option>
        <option value="RESOLVED">해결</option>
        <option value="CLOSED">종료</option>
      </select>
      <input v-model="filter.q" class="field !w-48" placeholder="제목 검색" @keyup.enter="reload" />
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th class="c">상태</th><th>{{ isVendor ? "업체" : "게임사" }}</th><th>제목</th><th>분류</th><th class="c">우선</th><th class="c">댓글</th><th class="muted">등록</th></tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length"><td colspan="7" class="state">응대 건이 없습니다.</td></tr>
          <tr v-for="t in rows" :key="t.id" class="row" @click="openDetail(t.id)">
            <td class="c"><span class="tag" :class="t.status.toLowerCase()">{{ statusLabel(t.status) }}</span></td>
            <td>{{ t.vendor_name || t.game_company_name || "-" }}</td>
            <td class="nm">{{ t.title }}</td>
            <td class="muted">{{ t.category || "-" }}</td>
            <td class="c"><span class="pri" :class="'p' + t.priority">{{ priLabel(t.priority) }}</span></td>
            <td class="c muted">{{ t.message_count }}</td>
            <td class="muted xs">{{ d(t.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 신규 등록 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">응대 등록</h4>
        <div class="grid">
          <label class="fld col2">
            <span class="form-label">{{ isVendor ? "업체" : "게임사" }}</span>
            <select v-model="form.party_id" class="field">
              <option :value="null" disabled>선택</option>
              <option v-for="o in parties" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </label>
          <BaseInput v-model="form.title" label="제목" class="col2" />
          <BaseInput v-model="form.category" label="분류" placeholder="예: 정산문의, 오류신고" />
          <label class="fld">
            <span class="form-label">우선순위</span>
            <select v-model.number="form.priority" class="field">
              <option :value="0">보통</option><option :value="1">높음</option><option :value="2">긴급</option>
            </select>
          </label>
          <label class="fld col2">
            <span class="form-label">내용</span>
            <textarea v-model="form.content" class="field-auto" rows="4" placeholder="최초 문의/응대 내용"></textarea>
          </label>
        </div>
        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="acts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? "저장 중…" : "등록" }}</button>
          <button class="btn" @click="showForm = false">취소</button>
        </div>
      </div>
    </div>

    <!-- 상세 -->
    <div v-if="detail" class="drawer" @click.self="detail = null">
      <div class="panel lg">
        <div class="dhead">
          <div>
            <h4 class="ph">{{ detail.title }}</h4>
            <p class="dsub">{{ detail.vendor_name || detail.game_company_name }} · {{ detail.category || "분류없음" }}</p>
          </div>
          <select v-model="detail.status" class="field !w-32" @change="changeStatus">
            <option value="OPEN">접수</option><option value="IN_PROGRESS">처리중</option>
            <option value="RESOLVED">해결</option><option value="CLOSED">종료</option>
          </select>
        </div>

        <div class="thread">
          <div v-if="!detail.messages.length" class="empty">메시지가 없습니다.</div>
          <div v-for="m in detail.messages" :key="m.id" class="msgrow" :class="{ internal: m.is_internal }">
            <div class="mmeta"><span v-if="m.is_internal" class="ibadge">내부</span>{{ d(m.created_at, true) }}</div>
            <div class="mbody">{{ m.content }}</div>
          </div>
        </div>

        <div class="reply">
          <label class="chk"><input v-model="reply.is_internal" type="checkbox" /> 내부 메모</label>
          <textarea v-model="reply.content" class="field-auto" rows="2" placeholder="답변/메모 입력"></textarea>
          <div class="acts">
            <button class="btn btn-primary" :disabled="sending || !reply.content.trim()" @click="sendMessage">전송</button>
            <button class="btn btn-danger" @click="removeTicket">삭제</button>
            <button class="btn" @click="detail = null">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import { supportApi, gameCompanyApi, vendorApi } from "@/api/cs";

const props = defineProps({ party: { type: String, default: "VENDOR" } });
const isVendor = computed(() => props.party === "VENDOR");
const toast = useToast();

const rows = ref([]);
const parties = ref([]);
const filter = reactive({ status: "", q: "" });

const showForm = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ party_id: null, title: "", category: "", priority: 0, content: "" });

const detail = ref(null);
const sending = ref(false);
const reply = reactive({ content: "", is_internal: false });

function d(v, withTime = false) { const s = String(v); return withTime ? s.slice(0, 16).replace("T", " ") : s.slice(0, 10); }
function statusLabel(s) { return { OPEN: "접수", IN_PROGRESS: "처리중", RESOLVED: "해결", CLOSED: "종료" }[s] || s; }
function priLabel(p) { return ["보통", "높음", "긴급"][p] || "보통"; }

async function reload() {
  const body = { party: props.party, limit: 200 };
  if (filter.status) body.status = filter.status;
  if (filter.q) body.q = filter.q;
  const res = await supportApi.list(body);
  rows.value = res.rows || [];
}
async function loadParties() {
  parties.value = isVendor.value ? await vendorApi.options() : await gameCompanyApi.options();
}
function openNew() {
  Object.assign(form, { party_id: null, title: "", category: "", priority: 0, content: "" });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    const t = await supportApi.save({
      party: props.party,
      vendor_id: isVendor.value ? form.party_id : null,
      game_company_id: isVendor.value ? null : form.party_id,
      title: form.title, category: form.category || null, priority: form.priority, status: "OPEN",
    });
    if (form.content.trim()) await supportApi.addMessage({ ticket_id: t.id, content: form.content, is_internal: false });
    toast.success("등록되었습니다."); showForm.value = false; await reload();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function openDetail(id) {
  detail.value = await supportApi.get(id);
  Object.assign(reply, { content: "", is_internal: false });
}
async function changeStatus() {
  try { await supportApi.setStatus(detail.value.id, detail.value.status); toast.success("상태가 변경되었습니다."); await reload(); }
  catch (e) { toast.error(e?.message || "변경 실패"); }
}
async function sendMessage() {
  sending.value = true;
  try {
    await supportApi.addMessage({ ticket_id: detail.value.id, content: reply.content, is_internal: reply.is_internal });
    detail.value = await supportApi.get(detail.value.id);
    Object.assign(reply, { content: "", is_internal: false });
    await reload();
  } catch (e) { toast.error(e?.message || "전송 실패"); }
  finally { sending.value = false; }
}
async function removeTicket() {
  if (!confirm("이 응대 건을 삭제할까요?")) return;
  try { await supportApi.remove(detail.value.id); toast.success("삭제되었습니다."); detail.value = null; await reload(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}

watch(() => props.party, async () => { filter.status = ""; filter.q = ""; detail.value = null; await Promise.all([reload(), loadParties()]); });
onMounted(async () => { await Promise.all([reload(), loadParties()]); });
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); text-transform: uppercase; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--ink); margin-top: 0.25rem; }
.filters { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }

.tablewrap { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--surface); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 1px solid var(--line); font-weight: 600; font-size: 0.78rem; color: var(--ink-muted); }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.row { cursor: pointer; } .row:hover { background: var(--surface-2); }
.c { text-align: center; } .nm { font-weight: 600; } .muted { color: var(--ink-muted); } .xs { font-size: 0.78rem; }
.state { text-align: center; padding: 1.6rem 0; color: var(--ink-faint); }
.tag { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; }
.tag.open { color: #b45309; background: #fef3c7; }
.tag.in_progress { color: #4f46e5; background: #e0e7ff; }
.tag.resolved { color: #047857; background: #d1fae5; }
.tag.closed { color: #64748b; background: #f1f5f9; }
.pri { font-size: 0.72rem; font-weight: 700; }
.pri.p0 { color: var(--ink-faint); } .pri.p1 { color: #b45309; } .pri.p2 { color: #dc2626; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 520px; max-width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.panel.lg { width: 640px; }
.ph { font-size: 1.1rem; font-weight: 700; color: var(--ink); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; } .col2 { grid-column: 1 / -1; }
.dhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.dsub { font-size: 0.82rem; color: var(--ink-muted); margin-top: 0.2rem; }
.thread { max-height: 44vh; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; padding: 0.5rem; background: var(--surface-2); border-radius: 10px; margin-bottom: 0.9rem; }
.thread .empty { text-align: center; color: var(--ink-faint); padding: 1rem 0; font-size: 0.85rem; }
.msgrow { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem 0.8rem; }
.msgrow.internal { background: #fffbeb; border-color: #fde68a; }
.mmeta { font-size: 0.7rem; color: var(--ink-faint); margin-bottom: 0.3rem; display: flex; gap: 0.4rem; align-items: center; }
.ibadge { font-size: 0.62rem; font-weight: 700; color: #b45309; background: #fef3c7; padding: 0.05rem 0.35rem; border-radius: 999px; }
.mbody { font-size: 0.88rem; color: var(--ink); white-space: pre-wrap; }
.reply .chk { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 0.4rem; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: #dc2626; }
.acts { display: flex; gap: 0.6rem; margin-top: 0.8rem; }
@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
</style>
