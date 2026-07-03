<template>
  <div>
    <div class="head">
      <h3 class="h">{{ $t("응대 유형") }} <span class="c">{{ desks.length }}</span></h3>
      <button class="btn btn-primary" @click="openNew"><i class="fa-solid fa-plus"></i> {{ $t("유형 추가") }}</button>
    </div>
    <p class="hint">{{ $t("CS 응대 유형(예: 업체 응대, 게임사 응대)을 추가·관리합니다. 각 유형은 자체 대상 트리를 가지며 사이드 메뉴에 표시됩니다.") }}</p>

    <ul class="list">
      <li v-if="!desks.length"><EmptyState icon="🗂️" :title="$t('응대 유형이 없어요')" :desc="$t('유형을 추가해 보세요.')" :hint="$t('＋ 유형 추가')" compact /></li>
      <li v-for="d in desks" :key="d.id" class="row">
        <span class="ic"><i class="fa-solid" :class="d.icon || 'fa-headset'"></i></span>
        <div class="rinfo">
          <span class="dn">{{ d.name }}</span>
          <code class="slug">/{{ d.code }}</code>
          <span v-if="!d.is_active" class="off">{{ $t("비활성") }}</span>
        </div>
        <div class="acts">
          <button class="btn btn-xs" @click="openEdit(d)">{{ $t("수정") }}</button>
          <button class="btn btn-xs btn-danger" @click="remove(d)">{{ $t("삭제") }}</button>
        </div>
      </li>
    </ul>

    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? $t("응대 유형 수정") : $t("응대 유형 추가") }}</h4>
        <div class="grid">
          <BaseInput v-model="form.name" :label="$t('유형명')" :placeholder="$t('예: 업체 응대')" />
          <BaseInput v-model="form.code" :label="$t('코드(영문)')" :disabled="editing" placeholder="vendor" />
          <BaseInput v-model="form.icon" :label="$t('아이콘(FontAwesome)')" placeholder="fa-store" />
          <BaseInput v-model="form.sort" :label="$t('정렬순서')" type="number" />
          <label class="fld toggle col2">
            <span class="form-label">{{ $t("활성") }}</span>
            <BaseToggle v-model="form.is_active" />
          </label>
        </div>
        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="pacts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? $t("저장 중…") : $t("저장") }}</button>
          <button class="btn" @click="showForm = false">{{ $t("취소") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import BaseToggle from "@/components/base/BaseToggle.vue";
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { confirmDelete } from "@/lib/ui";
import BaseInput from "@/components/base/BaseInput.vue";
import EmptyState from "@/components/base/EmptyState.vue";
import { supportDeskApi } from "@/api/cs";

const toast = useToast();
const desks = ref([]);
const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, name: "", code: "", icon: "", sort: 0, is_active: true });

async function load() { desks.value = await supportDeskApi.listAll(); }
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, name: "", code: "", icon: "", sort: desks.value.length, is_active: true });
  msg.value = ""; showForm.value = true;
}
function openEdit(d) {
  editing.value = true;
  Object.assign(form, { id: d.id, name: d.name, code: d.code, icon: d.icon || "", sort: d.sort, is_active: !!d.is_active });
  msg.value = ""; showForm.value = true;
}
async function submit() {
  msg.value = ""; saving.value = true;
  try {
    await supportDeskApi.save({ id: form.id || undefined, name: form.name, code: form.code, icon: form.icon || null, sort: Number(form.sort) || 0, is_active: form.is_active });
    toast.success("저장되었습니다."); showForm.value = false; await load();
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
async function remove(d) {
  if (!await confirmDelete(`'${d.name}' 유형을 삭제할까요? 대상 트리도 함께 삭제됩니다.`)) return;
  try { await supportDeskApi.remove(d.id); toast.success("삭제되었습니다."); await load(); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.h { font-weight: 700; color: var(--ink); }
.c { color: var(--seal); margin-left: 0.25rem; }
.hint { font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 0.8rem; }
.list { display: flex; flex-direction: column; gap: 0.5rem; }
.row { display: flex; align-items: center; gap: 0.8rem; padding: 0.7rem 1rem; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; }
.ic { width: 34px; height: 34px; flex-shrink: 0; display: grid; place-items: center; border: 2px solid var(--line-hard); border-radius: 3px; color: #fff; background: var(--seal); }
.rinfo { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
.dn { font-weight: 700; color: var(--ink); }
.slug { font-size: 0.75rem; color: var(--ink-faint); }
.off { font-size: 0.68rem; color: var(--ink-muted); background: var(--surface-2); padding: 0.05rem 0.4rem; border-radius: 3px; }
.acts { display: flex; gap: 0.35rem; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20,16,13,0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 460px; max-width: 100%; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-family: var(--font-pixel); font-size: 1.1rem; color: var(--ink); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; } .col2 { grid-column: 1 / -1; }
.toggle { display: flex; align-items: center; gap: 0.6rem; }
.toggle .form-label { margin-bottom: 0; }
.sw { width: 44px; height: 24px; border-radius: 3px; background: var(--surface-2); border: 2px solid var(--line-hard); position: relative; cursor: pointer; }
.sw.on { background: #2e7d43; }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 2px; background: var(--surface); border: 1px solid var(--line-hard); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.msg.err { color: var(--danger); font-size: 0.82rem; margin-top: 0.7rem; font-weight: 600; }
.pacts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
</style>
