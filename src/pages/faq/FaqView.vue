<template>
  <div class="page">
    <header class="phead">
      <div>
        <p class="eyebrow">CS 관리</p>
        <h1 class="ttl">자주 하는 질문</h1>
      </div>
      <button class="btn btn-primary" @click="openNew()">+ FAQ 추가</button>
    </header>

    <div class="filters">
      <input v-model="q" class="field !w-64" placeholder="질문·답변 검색" @keyup.enter="reload" />
      <select v-model="cat" class="field !w-40" @change="reload">
        <option value="">전체 분류</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div v-if="!rows.length" class="empty">등록된 FAQ가 없습니다.</div>
    <ul class="list">
      <li v-for="f in rows" :key="f.id" class="item">
        <div class="q" @click="toggle(f.id)">
          <span class="cat" v-if="f.category">{{ f.category }}</span>
          <span class="qt">{{ f.question }}</span>
          <i class="fa-solid fa-chevron-down chev" :class="{ up: open[f.id] }"></i>
        </div>
        <div v-if="open[f.id]" class="a">
          <p class="atext">{{ f.answer }}</p>
          <div class="itools">
            <button class="btn btn-xs" @click="openEdit(f)">수정</button>
            <button class="btn btn-xs btn-danger" @click="remove(f)">삭제</button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "FAQ 수정" : "FAQ 추가" }}</h4>
        <div class="fcol">
          <BaseInput v-model="form.category" label="분류" placeholder="예: 정산, 계정, 이용안내" />
          <BaseInput v-model="form.question" label="질문" />
          <label class="fld">
            <span class="form-label">답변</span>
            <textarea v-model="form.answer" class="field-auto" rows="5"></textarea>
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
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import { faqApi } from "@/api/cs";

const toast = useToast();
const rows = ref([]);
const categories = ref([]);
const open = reactive({});
const q = ref("");
const cat = ref("");

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, category: "", question: "", answer: "", sort: 0 });

async function reload() {
  rows.value = await faqApi.list({ q: q.value || undefined, category: cat.value || undefined });
}
async function loadCats() { categories.value = await faqApi.categories(); }
function toggle(id) { open[id] = !open[id]; }
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, category: "", question: "", answer: "", sort: 0 });
  msg.value = ""; showForm.value = true;
}
function openEdit(f) {
  editing.value = true;
  Object.assign(form, { id: f.id, category: f.category || "", question: f.question, answer: f.answer, sort: f.sort });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await faqApi.save({ id: form.id || undefined, category: form.category || null, question: form.question, answer: form.answer, sort: Number(form.sort) || 0, is_active: true });
    toast.success("저장되었습니다."); showForm.value = false; await Promise.all([reload(), loadCats()]);
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function remove(f) {
  if (!confirm("이 FAQ를 삭제할까요?")) return;
  try { await faqApi.remove(f.id); toast.success("삭제되었습니다."); await reload(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(async () => { await Promise.all([reload(), loadCats()]); });
</script>

<style scoped>
.page { max-width: 860px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); text-transform: uppercase; }
.ttl { font-size: 1.5rem; font-weight: 800; color: var(--ink); margin-top: 0.25rem; }
.filters { display: flex; gap: 0.5rem; margin-bottom: 0.9rem; }
.empty { text-align: center; color: var(--ink-faint); padding: 2rem 0; }

.list { display: flex; flex-direction: column; gap: 0.5rem; }
.item { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.q { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1rem; cursor: pointer; }
.q:hover { background: var(--surface-2); }
.cat { font-size: 0.68rem; font-weight: 700; color: var(--seal); background: #e0e7ff; padding: 0.1rem 0.5rem; border-radius: 999px; flex-shrink: 0; }
.qt { font-weight: 600; color: var(--ink); flex: 1; }
.chev { font-size: 0.7rem; color: var(--ink-faint); transition: transform 0.2s; }
.chev.up { transform: rotate(180deg); }
.a { padding: 0 1rem 1rem; border-top: 1px solid var(--line); }
.atext { font-size: 0.9rem; color: var(--ink-soft); white-space: pre-wrap; line-height: 1.6; padding-top: 0.8rem; }
.itools { display: flex; gap: 0.4rem; margin-top: 0.8rem; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 560px; max-width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.fcol { display: flex; flex-direction: column; gap: 0.9rem; }
.fld { display: block; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; } .msg.err { color: #dc2626; }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
</style>
