<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">CS 관리</p>
        <h1 class="ttl">{{ isVendor ? "업체 응대" : "게임사 응대" }}</h1>
      </div>
    </header>

    <div class="split">
      <!-- 좌측: 업체/게임사 트리 -->
      <aside class="pane pcard left">
        <EntityTree
          :key="party"
          ref="treeRef"
          :api="isVendor ? vendorApi : gameCompanyApi"
          :label="isVendor ? '업체' : '게임사'"
          :empty-icon="isVendor ? '🏪' : '🎮'"
          :selected-id="selected?.id"
          @select="onSelect"
        />
      </aside>

      <!-- 우측: 선택 대상 응대 -->
      <section class="pane pcard right">
        <div v-if="!selected" class="pane-empty">
          <EmptyState variant="select" :desc="isVendor ? '좌측에서 업체를 선택하면 응대가 여기에 표시돼요.' : '좌측에서 게임사를 선택하면 응대가 여기에 표시돼요.'" />
        </div>

        <template v-else>
          <div class="r-head">
            <div class="r-title">
              <span class="r-eye">{{ isVendor ? "업체" : "게임사" }}</span>
              <h3 class="r-name">{{ selected.name }}</h3>
            </div>
            <div class="r-tools">
              <div class="w-44"><TagSelect v-model="filterTags" placeholder="태그 필터" @change="applyFilter" /></div>
              <div class="w-28 shrink-0"><SearchSelect v-model="filter.status" :options="STATUS_OPTS" placeholder="전체 상태" @change="applyFilter" /></div>
              <button class="btn btn-primary" @click="openNew">+ 등록</button>
            </div>
          </div>

          <!-- 일괄 상태 변경 바 -->
          <div v-if="sel.length" class="bulkbar">
            <span class="bcount">✔ {{ sel.length }}건 선택</span>
            <span class="barrow">→</span>
            <div class="w-28 shrink-0"><SearchSelect v-model="bulkVal" :options="STATUS_OPTS" placeholder="변경할 상태" /></div>
            <button class="btn btn-xs btn-primary" :disabled="!bulkVal || bulking" @click="applyBulk">{{ bulking ? "적용 중…" : "일괄 적용" }}</button>
            <button class="btn btn-xs" @click="clearSel">선택 해제</button>
          </div>

          <div class="r-body">
            <table class="tbl">
              <thead>
                <tr>
                  <th class="c cbx"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
                  <th class="c">상태</th><th>제목</th><th>분류</th><th class="c">우선</th><th class="c">댓글</th><th class="muted">등록</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!tickets.length"><td colspan="7"><EmptyState variant="support" compact /></td></tr>
                <tr v-for="t in tickets" :key="t.id" class="row" :class="{ sel: sel.includes(t.id) }" @click="openDetail(t.id)">
                  <td class="c cbx" @click.stop><input type="checkbox" :checked="sel.includes(t.id)" @change="toggleRow(t.id)" /></td>
                  <td class="c"><span class="badge" :class="'st-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span></td>
                  <td class="nm">{{ t.title }} <TagChips :tags="t.tags" /></td>
                  <td class="muted">{{ t.category || "-" }}</td>
                  <td class="c"><span class="pri" :class="'p' + t.priority">{{ priLabel(t.priority) }}</span></td>
                  <td class="c muted">{{ t.message_count }}</td>
                  <td class="muted xs num">{{ d(t.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="r-foot">
            <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reloadTickets" />
          </div>
        </template>
      </section>
    </div>

    <!-- 신규 등록 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">응대 등록 · {{ selected?.name }}</h4>
        <div class="grid">
          <BaseInput v-model="form.title" label="제목" class="col2" />
          <BaseInput v-model="form.category" label="분류" placeholder="예: 정산문의, 오류신고" />
          <label class="fld">
            <span class="form-label">우선순위</span>
            <SearchSelect v-model="form.priority" :options="PRIO_OPTS" />
          </label>
          <label class="fld col2">
            <span class="form-label">태그</span>
            <TagSelect v-model="form.tag_ids" />
          </label>
          <label class="fld col2">
            <span class="form-label">내용</span>
            <RichEditor v-model="form.content" placeholder="최초 문의/응대 내용" />
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
          <SearchSelect class="!w-32" v-model="detail.status" :options="STATUS_OPTS" @change="changeStatus" />
        </div>

        <div class="dtags">
          <span class="dtags-lbl">🏷️ 태그</span>
          <div class="dtags-sel"><TagSelect v-model="detailTags" @change="updateDetailTags" /></div>
        </div>

        <div class="thread">
          <div v-if="!detail.messages.length"><EmptyState icon="✉️" title="아직 대화가 없어요" desc="첫 메시지를 남겨보세요." hint="아래에 입력!" compact /></div>
          <div v-for="m in detail.messages" :key="m.id" class="msgrow" :class="{ internal: m.is_internal }">
            <div class="mmeta"><span v-if="m.is_internal" class="ibadge">내부</span>{{ d(m.created_at, true) }}</div>
            <div class="mbody prose" v-html="m.content"></div>
          </div>
        </div>

        <div class="reply">
          <label class="chk"><input v-model="reply.is_internal" type="checkbox" /> 내부 메모</label>
          <RichEditor v-model="reply.content" placeholder="답변/메모 입력" />
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
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import BaseInput from "@/components/base/BaseInput.vue";
import Pager from "@/components/base/Pager.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import EntityTree from "@/components/base/EntityTree.vue";
import RichEditor from "@/components/base/RichEditor.vue";
import TagSelect from "@/components/base/TagSelect.vue";
import TagChips from "@/components/base/TagChips.vue";
import { supportApi, vendorApi, gameCompanyApi } from "@/api/cs";

const route = useRoute();

const STATUS_OPTS = [
  { value: "OPEN", label: "접수", color: "#f59e0b" },
  { value: "IN_PROGRESS", label: "처리중", color: "#7a5cff" },
  { value: "RESOLVED", label: "해결", color: "#0ea88f" },
  { value: "CLOSED", label: "종료", color: "#94a3b8" },
];
const PRIO_OPTS = [
  { value: 0, label: "보통", color: "#94a3b8" },
  { value: 1, label: "높음", color: "#e07d16" },
  { value: 2, label: "긴급", color: "#e23b46" },
];

const props = defineProps({ party: { type: String, default: "VENDOR" } });
const isVendor = computed(() => props.party === "VENDOR");
const toast = useToast();

const LIMIT = 15;
const selected = ref(null);
const tickets = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const filter = reactive({ status: "" });
const filterTags = ref([]);
const detailTags = ref([]);
const sel = ref([]);
const bulkVal = ref("");
const bulking = ref(false);
const allChecked = computed(() => tickets.value.length > 0 && tickets.value.every((t) => sel.value.includes(t.id)));

const treeRef = ref(null);

const showForm = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ title: "", category: "", priority: 0, content: "", tag_ids: [] });

const detail = ref(null);
const sending = ref(false);
const reply = reactive({ content: "", is_internal: false });

function d(v, withTime = false) { const s = String(v); return withTime ? s.slice(0, 16).replace("T", " ") : s.slice(0, 10); }
function statusLabel(s) { return { OPEN: "접수", IN_PROGRESS: "처리중", RESOLVED: "해결", CLOSED: "종료" }[s] || s; }
function priLabel(p) { return ["보통", "높음", "긴급"][p] || "보통"; }

function onSelect(entity) {
  selected.value = entity;
  page.value = 1;
  filter.status = "";
  filterTags.value = [];
  reloadTickets();
}
function applyFilter() { page.value = 1; reloadTickets(); }

function toggleAll() { sel.value = allChecked.value ? [] : tickets.value.map((t) => t.id); }
function toggleRow(id) { sel.value = sel.value.includes(id) ? sel.value.filter((x) => x !== id) : [...sel.value, id]; }
function clearSel() { sel.value = []; bulkVal.value = ""; }
async function applyBulk() {
  if (!bulkVal.value || !sel.value.length) return;
  bulking.value = true;
  try {
    const r = await supportApi.bulkStatus(sel.value, bulkVal.value);
    toast.success(`${r.count}건 상태를 변경했습니다.`);
    clearSel();
    await reloadTickets();
  } catch (e) { toast.error(e?.message || "일괄 변경 실패"); }
  finally { bulking.value = false; }
}

async function reloadTickets() {
  sel.value = [];
  if (treeRef.value?.reload) treeRef.value.reload(); // 트리 미해결 카운트 갱신
  if (!selected.value) { tickets.value = []; total.value = 0; totalPages.value = 1; return; }
  const body = { party: props.party, page: page.value, limit: LIMIT };
  body[isVendor.value ? "vendor_id" : "game_company_id"] = selected.value.id;
  if (filter.status) body.status = filter.status;
  if (filterTags.value.length) body.tag_ids = filterTags.value;
  const res = await supportApi.list(body);
  tickets.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 1;
}

async function loadLeft() {
  selected.value = null;
  tickets.value = [];
}

function openNew() {
  Object.assign(form, { title: "", category: "", priority: 0, content: "", tag_ids: [] });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    const t = await supportApi.save({
      party: props.party,
      vendor_id: isVendor.value ? selected.value.id : null,
      game_company_id: isVendor.value ? null : selected.value.id,
      title: form.title, category: form.category || null, priority: form.priority, status: "OPEN",
      tag_ids: form.tag_ids,
    });
    if (form.content.trim()) await supportApi.addMessage({ ticket_id: t.id, content: form.content, is_internal: false });
    toast.success("등록되었습니다."); showForm.value = false; await reloadTickets();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function openDetail(id) {
  detail.value = await supportApi.get(id);
  detailTags.value = (detail.value.tags || []).map((t) => t.id);
  Object.assign(reply, { content: "", is_internal: false });
}
// 상세에서 태그 변경 시 즉시 저장
async function updateDetailTags(ids) {
  if (!detail.value) return;
  try {
    await supportApi.save({
      id: detail.value.id,
      party: detail.value.party,
      vendor_id: detail.value.vendor_id,
      game_company_id: detail.value.game_company_id,
      title: detail.value.title,
      category: detail.value.category,
      status: detail.value.status,
      priority: detail.value.priority,
      tag_ids: ids,
    });
    await reloadTickets();
  } catch (e) { toast.error(e?.message || "태그 저장 실패"); }
}
async function changeStatus() {
  try { await supportApi.setStatus(detail.value.id, detail.value.status); toast.success("상태가 변경되었습니다."); await reloadTickets(); }
  catch (e) { toast.error(e?.message || "변경 실패"); }
}
async function sendMessage() {
  sending.value = true;
  try {
    await supportApi.addMessage({ ticket_id: detail.value.id, content: reply.content, is_internal: reply.is_internal });
    detail.value = await supportApi.get(detail.value.id);
    Object.assign(reply, { content: "", is_internal: false });
    await reloadTickets();
  } catch (e) { toast.error(e?.message || "전송 실패"); }
  finally { sending.value = false; }
}
async function removeTicket() {
  if (!await confirmDelete("이 응대 건을 삭제할까요?")) return;
  try { await supportApi.remove(detail.value.id); toast.success("삭제되었습니다."); detail.value = null; await reloadTickets(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}

// 알림 바로가기: ?open=<ticketId> 로 진입하면 해당 티켓을 선택·상세 오픈
async function handleOpenQuery() {
  const id = Number(route.query.open);
  if (!id) return;
  try {
    const t = await supportApi.get(id);
    if (t.party !== props.party) return;
    selected.value = isVendor.value
      ? { id: t.vendor_id, name: t.vendor_name }
      : { id: t.game_company_id, name: t.game_company_name };
    await reloadTickets();
    detail.value = t;
    detailTags.value = (t.tags || []).map((x) => x.id);
    Object.assign(reply, { content: "", is_internal: false });
  } catch (e) { /* 없는 티켓이면 무시 */ }
}

watch(() => props.party, async () => { detail.value = null; await loadLeft(); await handleOpenQuery(); });
watch(() => route.query.open, handleOpenQuery);
onMounted(async () => { await loadLeft(); await handleOpenQuery(); });
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; }
.phead { margin-bottom: 1rem; }
.eyebrow { font-family: var(--font-pixel); font-size: 0.66rem; letter-spacing: 0.16em; color: var(--seal); }
.ttl { font-family: var(--font-pixel); font-size: 1.35rem; color: var(--ink); margin-top: 0.25rem; }

.split { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; align-items: stretch; }
@media (max-width: 820px) { .split { grid-template-columns: 1fr; } .pane { height: auto; min-height: 320px; } }

/* 좌우 동일 높이 카드 (상단 정렬 + 내부 스크롤) */
.pane { height: 74vh; min-height: 420px; overflow: hidden; display: flex; flex-direction: column; padding: 0; }
.glist { display: flex; flex-direction: column; height: 100%; }
.gl-head { padding: 0.6rem; border-bottom: 2px solid var(--line); }
.gl-body { flex: 1; overflow-y: auto; padding: 0.3rem; }
.gl-empty { text-align: center; color: var(--ink-faint); padding: 1.4rem 0; font-size: 0.85rem; }
.gl-row { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.5rem; border-radius: 3px; cursor: pointer; font-size: 0.86rem; }
.gl-row:hover { background: var(--surface-2); }
.gl-row.on { background: #ede9ff; box-shadow: inset 0 0 0 2px var(--seal); }
.gl-row .nm { flex: 1; font-weight: 600; color: var(--ink); }
.gl-row .code { font-size: 0.66rem; color: var(--ink-faint); }

.right { min-width: 0; }
.pane-empty { flex: 1; display: flex; align-items: center; justify-content: center; padding: 1rem; }

.r-head { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; padding: 0.65rem 0.85rem; border-bottom: 2px solid var(--line); flex-wrap: wrap; flex-shrink: 0; }
.r-title { display: flex; flex-direction: column; line-height: 1.15; }
.r-eye { font-family: var(--font-pixel); font-size: 0.6rem; color: var(--seal-deep); }
.r-name { font-family: var(--font-pixel); font-size: 1rem; color: var(--ink); }
.r-tools { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
.r-body { flex: 1; overflow-y: auto; }
.r-foot { flex-shrink: 0; padding: 0.4rem 0.85rem; border-top: 2px solid var(--line); }
.r-foot :deep(.pager) { margin-top: 0; }

/* 일괄 상태 변경 바 */
.bulkbar { flex-shrink: 0; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.85rem; background: #ede9ff; border-bottom: 2px solid var(--line); flex-wrap: wrap; }
.bcount { font-family: var(--font-pixel); font-size: 0.7rem; color: var(--seal-deep); }
.barrow { color: var(--ink-faint); }
.cbx { width: 38px; }
.cbx input { accent-color: var(--seal); width: 15px; height: 15px; cursor: pointer; }
.row.sel { background: #f3f0ff; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl thead th { position: sticky; top: 0; z-index: 1; }
.tbl th { text-align: left; padding: 0.55rem 0.7rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-family: var(--font-pixel); font-weight: 600; font-size: 0.72rem; color: var(--ink-muted); }
.tbl td { padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--line); font-size: 0.86rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.row { cursor: pointer; } .row:hover { background: var(--surface-2); }
.c { text-align: center; } .nm { font-weight: 600; } .muted { color: var(--ink-muted); } .xs { font-size: 0.74rem; }
.state { text-align: center; padding: 1.4rem 0; color: var(--ink-faint); }
.st-open { background: #fef3c7; color: #b45309; }
.st-in_progress { background: #ede9ff; color: var(--seal-deep); }
.st-resolved { background: var(--flow-in-bg); color: var(--flow-in); }
.st-closed { background: var(--surface-2); color: var(--ink-muted); }
.pri { font-family: var(--font-pixel); font-size: 0.66rem; }
.pri.p0 { color: var(--ink-faint); } .pri.p1 { color: #b45309; } .pri.p2 { color: var(--danger); }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(27,29,46,0.55); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 520px; max-width: 100%; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.panel.lg { width: 640px; }
.ph { font-family: var(--font-pixel); font-size: 1rem; color: var(--ink); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; } .col2 { grid-column: 1 / -1; }
.dhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.dsub { font-size: 0.82rem; color: var(--ink-muted); margin-top: 0.2rem; }
.dtags { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.9rem; }
.dtags-lbl { font-family: var(--font-pixel); font-size: 0.64rem; color: var(--ink-muted); flex-shrink: 0; }
.dtags-sel { flex: 1; }
.thread { max-height: 44vh; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; padding: 0.5rem; background: var(--surface-2); border-radius: 3px; margin-bottom: 0.9rem; }
.thread .empty { text-align: center; color: var(--ink-faint); padding: 1rem 0; font-size: 0.85rem; }
.msgrow { background: #fff; border: 2px solid var(--line); border-radius: 3px; padding: 0.6rem 0.8rem; }
.msgrow.internal { background: #fffbeb; border-color: #fde68a; }
.mmeta { font-size: 0.7rem; color: var(--ink-faint); margin-bottom: 0.3rem; display: flex; gap: 0.4rem; align-items: center; }
.ibadge { font-size: 0.62rem; font-weight: 700; color: #b45309; background: #fef3c7; padding: 0.05rem 0.35rem; border-radius: 3px; }
.mbody { font-size: 0.88rem; color: var(--ink); line-height: 1.6; }
.mbody :deep(img) { max-width: 100%; border-radius: 3px; margin: 0.3rem 0; }
.mbody :deep(ul), .mbody :deep(ol) { padding-left: 1.3rem; margin: 0.3rem 0; }
.mbody :deep(a) { color: var(--seal); text-decoration: underline; }
.mbody :deep(blockquote) { border-left: 3px solid var(--seal); padding-left: 0.7rem; color: var(--ink-muted); margin: 0.4rem 0; }
.reply .chk { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 0.4rem; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: var(--danger); }
.acts { display: flex; gap: 0.6rem; margin-top: 0.8rem; }
@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
</style>
