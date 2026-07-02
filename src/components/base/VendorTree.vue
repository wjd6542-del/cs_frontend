<template>
  <div class="vtree">
    <div class="vt-head">
      <input v-model="kw" class="field field-xs" placeholder="업체 명칭 검색" />
      <button class="btn btn-xs btn-primary" title="최상위 업체 추가" @click="startAdd(null)">＋</button>
    </div>

    <!-- 추가 입력 바 -->
    <div v-if="adding" class="vt-edit">
      <span class="vt-under" v-if="adding.parent_name">↳ {{ adding.parent_name }} 하위</span>
      <input ref="addInput" v-model="addName" class="field field-xs" placeholder="업체명" @keyup.enter="confirmAdd" @keyup.esc="adding = null" />
      <button class="btn btn-xs btn-primary" @click="confirmAdd">저장</button>
      <button class="btn btn-xs" @click="adding = null">취소</button>
    </div>

    <div class="vt-body">
      <div v-if="!flat.length" class="vt-empty">업체가 없습니다.</div>
      <div
        v-for="row in flat"
        :key="row.node.id"
        class="vt-row"
        :class="{ on: row.node.id === selectedId, dim: !row.node.is_active }"
        :style="{ paddingLeft: 0.4 + row.depth * 0.9 + 'rem' }"
        @click="select(row.node)"
      >
        <button v-if="row.hasChildren" class="caret" @click.stop="toggle(row.node.id)">
          <i class="fa-solid" :class="isCollapsed(row.node.id) ? 'fa-caret-right' : 'fa-caret-down'"></i>
        </button>
        <span v-else class="caret ph"></span>

        <template v-if="editId === row.node.id">
          <input v-model="editName" class="field field-xs !h-[24px] flex-1" @click.stop @keyup.enter="confirmEdit" @keyup.esc="editId = null" />
          <button class="ico ok" @click.stop="confirmEdit"><i class="fa-solid fa-check"></i></button>
          <button class="ico" @click.stop="editId = null"><i class="fa-solid fa-xmark"></i></button>
        </template>
        <template v-else>
          <span class="nm">{{ row.node.name }}</span>
          <span class="code num">{{ row.node.code }}</span>
          <span class="acts">
            <button class="ico" title="하위 추가" @click.stop="startAdd(row.node)"><i class="fa-solid fa-plus"></i></button>
            <button class="ico" title="명칭 수정" @click.stop="startEdit(row.node)"><i class="fa-solid fa-pen"></i></button>
            <button class="ico del" title="삭제" @click.stop="remove(row.node)"><i class="fa-solid fa-trash"></i></button>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { useToast } from "vue-toastification";
import { vendorApi } from "@/api/cs";

const props = defineProps({ selectedId: { type: Number, default: null } });
const emit = defineEmits(["select", "change"]);
const toast = useToast();

const roots = ref([]);
const collapsed = reactive({});
const kw = ref("");

const adding = ref(null); // { parent_id, parent_name }
const addName = ref("");
const addInput = ref(null);
const editId = ref(null);
const editName = ref("");

function isCollapsed(id) { return !!collapsed[id]; }
function toggle(id) { collapsed[id] = !collapsed[id]; }

// 검색어로 가지치기 (매칭 노드 + 조상 유지)
function filterTree(nodes) {
  const k = kw.value.trim().toLowerCase();
  if (!k) return nodes;
  const walk = (list) =>
    list
      .map((n) => {
        const kids = walk(n.children || []);
        const hit = n.name.toLowerCase().includes(k) || (n.code || "").toLowerCase().includes(k);
        if (hit || kids.length) return { ...n, children: kids };
        return null;
      })
      .filter(Boolean);
  return walk(nodes);
}

const flat = computed(() => {
  const out = [];
  const searching = !!kw.value.trim();
  const walk = (nodes, depth) => {
    for (const n of nodes) {
      const hasChildren = (n.children || []).length > 0;
      out.push({ node: n, depth, hasChildren });
      if (hasChildren && (searching || !collapsed[n.id])) walk(n.children, depth + 1);
    }
  };
  walk(filterTree(roots.value), 0);
  return out;
});

async function reload() {
  roots.value = await vendorApi.tree();
}
function select(node) { emit("select", { id: node.id, name: node.name, code: node.code }); }

function startAdd(parent) {
  adding.value = { parent_id: parent?.id ?? null, parent_name: parent?.name ?? "" };
  addName.value = "";
  editId.value = null;
  nextTick(() => addInput.value?.focus());
}
async function confirmAdd() {
  const name = addName.value.trim();
  if (!name) return;
  try {
    await vendorApi.save({ name, parent_id: adding.value.parent_id });
    if (adding.value.parent_id) collapsed[adding.value.parent_id] = false;
    adding.value = null;
    await reload();
    emit("change");
    toast.success("업체가 등록되었습니다.");
  } catch (e) { toast.error(e?.message || "등록 실패"); }
}

function startEdit(node) {
  editId.value = node.id;
  editName.value = node.name;
  adding.value = null;
}
async function confirmEdit() {
  const name = editName.value.trim();
  if (!name) return;
  try {
    await vendorApi.save({ id: editId.value, name });
    editId.value = null;
    await reload();
    emit("change");
    toast.success("명칭이 수정되었습니다.");
  } catch (e) { toast.error(e?.message || "수정 실패"); }
}

async function remove(node) {
  if (!confirm(`'${node.name}' 업체를 삭제할까요?`)) return;
  try {
    await vendorApi.remove(node.id);
    await reload();
    emit("change");
    toast.success("삭제되었습니다.");
  } catch (e) { toast.error(e?.message || "삭제 실패"); }
}

defineExpose({ reload });
onMounted(reload);
</script>

<style scoped>
.vtree { display: flex; flex-direction: column; height: 100%; }
.vt-head { display: flex; gap: 0.35rem; padding: 0.6rem; border-bottom: 2px solid var(--line); }
.vt-head .field { flex: 1; }
.vt-edit { display: flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.6rem; background: var(--surface-2); border-bottom: 2px solid var(--line); flex-wrap: wrap; }
.vt-under { font-size: 0.68rem; color: var(--seal-deep); font-family: var(--font-pixel); width: 100%; }
.vt-body { flex: 1; overflow-y: auto; padding: 0.3rem; }
.vt-empty { text-align: center; color: var(--ink-faint); padding: 1.4rem 0; font-size: 0.85rem; }

.vt-row { display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.86rem; }
.vt-row:hover { background: var(--surface-2); }
.vt-row.on { background: #ede9ff; box-shadow: inset 0 0 0 2px var(--seal); }
.vt-row.dim .nm { color: var(--ink-faint); text-decoration: line-through; }
.caret { width: 18px; height: 18px; flex-shrink: 0; display: grid; place-items: center; color: var(--ink-muted); font-size: 0.75rem; }
.caret.ph { visibility: hidden; }
.nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: var(--ink); }
.code { font-size: 0.66rem; color: var(--ink-faint); flex-shrink: 0; }
.acts { display: none; gap: 0.1rem; flex-shrink: 0; }
.vt-row:hover .acts { display: flex; }
.ico { width: 24px; height: 22px; display: grid; place-items: center; border-radius: 3px; font-size: 0.72rem; color: var(--ink-muted); }
.ico:hover { background: #fff; color: var(--seal); box-shadow: 1px 1px 0 var(--line-hard); }
.ico.del:hover { color: var(--danger); }
.ico.ok { color: var(--flow-in); }
</style>
