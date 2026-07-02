<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">CS 관리</p>
        <h1 class="ttl">자주 하는 질문</h1>
      </div>
      <button class="btn btn-primary" @click="openNew()">+ FAQ 추가</button>
    </header>

    <!-- 검색 영역 -->
    <div class="filterbar">
      <input v-model="q" class="field !w-56" placeholder="질문·답변 검색" @keyup.enter="search" />
      <div class="msbox"><MultiSelect v-model="cats" :options="catOptions" placeholder="분류(다중 선택)" search-placeholder="분류 검색…" @change="search" /></div>
      <div class="msbox"><TagSelect v-model="ftags" placeholder="태그 필터" @change="search" /></div>
    </div>

    <!-- 목록 영역 -->
    <div v-if="!rows.length" class="listcard"><EmptyState variant="faq" /></div>
    <ul v-else class="list">
      <li v-for="f in rows" :key="f.id" class="item">
        <div class="q" @click="toggle(f.id)">
          <span class="cat" v-if="f.category">{{ f.category }}</span>
          <span class="qt">{{ f.question }}</span>
          <TagChips :tags="f.tags" />
          <i class="fa-solid fa-chevron-down chev" :class="{ up: open[f.id] }"></i>
        </div>
        <div v-if="open[f.id]" class="a">
          <div class="atext prose" v-html="f.answer"></div>
          <div class="itools">
            <button class="btn btn-xs" @click="openEdit(f)">수정</button>
            <button class="btn btn-xs btn-danger" @click="remove(f)">삭제</button>
          </div>
        </div>
      </li>
    </ul>

    <Pager v-model:page="page" :total-pages="totalPages" :total="total" @change="reload" />

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "FAQ 수정" : "FAQ 추가" }}</h4>
        <div class="fcol">
          <label class="fld">
            <span class="form-label">분류</span>
            <SearchSelect v-model="form.category" :options="catOptions" placeholder="분류 선택 (환경설정에서 관리)" search-placeholder="분류 검색…" />
          </label>
          <BaseInput v-model="form.question" label="질문" />
          <label class="fld">
            <span class="form-label">태그</span>
            <TagSelect v-model="form.tag_ids" />
          </label>
          <label class="fld">
            <span class="form-label">답변</span>
            <RichEditor v-model="form.answer" placeholder="답변 내용" />
          </label>
          <BaseInput v-model="form.sort" label="정렬순서" type="number" />
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
import SearchSelect from "@/components/base/SearchSelect.vue";
import MultiSelect from "@/components/base/MultiSelect.vue";
import RichEditor from "@/components/base/RichEditor.vue";
import TagSelect from "@/components/base/TagSelect.vue";
import TagChips from "@/components/base/TagChips.vue";
import { faqApi, faqCategoryApi } from "@/api/cs";

const LIMIT = 10;
const toast = useToast();
const rows = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const categories = ref([]);
const open = reactive({});
const q = ref("");
const cats = ref([]);
const ftags = ref([]);

const catOptions = computed(() => categories.value.map((c) => ({ value: c.name, label: c.name })));

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, category: "", question: "", answer: "", sort: 0, tag_ids: [] });

async function reload() {
  const res = await faqApi.list({
    q: q.value || undefined,
    categories: cats.value.length ? cats.value : undefined,
    tag_ids: ftags.value.length ? ftags.value : undefined,
    page: page.value,
    limit: LIMIT,
  });
  rows.value = res.rows || [];
  total.value = res.total || 0;
  totalPages.value = res.totalPages || 1;
}
function search() { page.value = 1; reload(); }
async function loadCats() { categories.value = await faqCategoryApi.list({ only_active: true }); }
function toggle(id) { open[id] = !open[id]; }
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, category: "", question: "", answer: "", sort: 0, tag_ids: [] });
  msg.value = ""; showForm.value = true;
}
function openEdit(f) {
  editing.value = true;
  Object.assign(form, { id: f.id, category: f.category || "", question: f.question, answer: f.answer, sort: f.sort, tag_ids: (f.tags || []).map((t) => t.id) });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await faqApi.save({ id: form.id || undefined, category: form.category || null, question: form.question, answer: form.answer, sort: Number(form.sort) || 0, is_active: true, tag_ids: form.tag_ids });
    toast.success("저장되었습니다."); showForm.value = false; await reload();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function remove(f) {
  if (!await confirmDelete("이 FAQ를 삭제할까요?")) return;
  try { await faqApi.remove(f.id); toast.success("삭제되었습니다."); await reload(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(async () => { await Promise.all([reload(), loadCats()]); });
</script>

<style scoped>
.page { max-width: 860px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; }
.eyebrow { font-family: var(--font-pixel); font-size: 0.66rem; letter-spacing: 0.16em; color: var(--seal); }
.ttl { font-family: var(--font-pixel); font-size: 1.35rem; color: var(--ink); margin-top: 0.25rem; }
.msbox { width: 12rem; }

.listcard { background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); }
.list { display: flex; flex-direction: column; gap: 0.5rem; }
.item { background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); overflow: hidden; }
.q { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; cursor: pointer; }
.q:hover { background: var(--surface-2); }
.cat { font-family: var(--font-pixel); font-size: 0.64rem; color: var(--seal-deep); background: #ede9ff; border: 1px solid var(--line-hard); padding: 0.1rem 0.45rem; border-radius: 3px; flex-shrink: 0; }
.qt { font-weight: 600; color: var(--ink); flex: 1; }
.chev { font-size: 0.7rem; color: var(--ink-faint); transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }
.a { padding: 0 1rem 1rem; border-top: 1px solid var(--line); }
.atext { font-size: 0.9rem; color: var(--ink-soft); line-height: 1.6; padding-top: 0.8rem; }
.atext :deep(img) { max-width: 100%; border-radius: 3px; }
.atext :deep(ul), .atext :deep(ol) { padding-left: 1.3rem; margin: 0.3rem 0; }
.atext :deep(a) { color: var(--seal); text-decoration: underline; }
.itools { display: flex; gap: 0.4rem; margin-top: 0.8rem; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(27, 29, 46, 0.55); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 560px; max-width: 100%; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-family: var(--font-pixel); font-size: 1rem; color: var(--ink); margin-bottom: 1rem; }
.fcol { display: flex; flex-direction: column; gap: 0.9rem; }
.fld { display: block; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: var(--danger); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
</style>
