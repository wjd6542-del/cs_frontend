<template>
  <div class="radmin">
    <div class="cols">
      <!-- 역할 목록 -->
      <div class="rolelist">
        <div class="rl-head">
          <h3 class="h">역할</h3>
          <button class="add" @click="openNewRole">+ 역할</button>
        </div>
        <ul class="rl">
          <li
            v-for="r in roles"
            :key="r.id"
            class="ritem"
            :class="{ on: sel?.id === r.id }"
            @click="select(r)"
          >
            <span class="rname">{{ r.name }}</span>
            <span v-if="r.is_super" class="super">전체</span>
          </li>
        </ul>
      </div>

      <!-- 권한 할당 -->
      <div class="perm">
        <template v-if="sel">
          <div class="p-head">
            <div>
              <h3 class="h">{{ sel.name }} <span v-if="sel.is_super" class="super">슈퍼</span></h3>
              <p class="pdesc">{{ sel.description || "권한을 선택해 저장하세요." }}</p>
            </div>
            <button v-if="!sel.is_super" class="save" :disabled="saving" @click="savePerms">{{ saving ? "저장 중…" : "권한 저장" }}</button>
          </div>

          <p v-if="sel.is_super" class="supernote">슈퍼관리자는 모든 권한을 자동으로 가집니다.</p>
          <div v-else class="groups">
            <div v-for="(perms, g) in grouped" :key="g" class="group">
              <div class="gtitle">{{ g }}</div>
              <label v-for="p in perms" :key="p.id" class="pcheck">
                <input type="checkbox" :value="p.id" v-model="checked" />
                <span>{{ p.name }}</span>
                <code>{{ p.code }}</code>
              </label>
            </div>
          </div>
        </template>
        <div v-else class="empty">역할을 선택하세요.</div>
      </div>
    </div>

    <!-- 새 역할 -->
    <div v-if="showRole" class="drawer" @click.self="showRole = false">
      <div class="panel">
        <h4 class="ph">새 역할</h4>
        <BaseInput v-model="newRole.name" label="역할 이름" placeholder="예: 편집위원" />
        <div style="margin-top:0.8rem"><BaseInput v-model="newRole.description" label="설명" /></div>
        <p v-if="rmsg" class="msg err">{{ rmsg }}</p>
        <div class="acts">
          <button class="save" @click="createRole">저장</button>
          <button class="cancel" @click="showRole = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import { adminApi } from "@/api/admin";

const toast = useToast();
const roles = ref([]);
const permissions = ref([]);
const sel = ref(null);
const checked = ref([]);
const saving = ref(false);

const showRole = ref(false);
const newRole = reactive({ name: "", description: "" });
const rmsg = ref("");

const grouped = computed(() => {
  const g = {};
  for (const p of permissions.value) {
    (g[p.group || "기타"] ||= []).push(p);
  }
  return g;
});

async function load() {
  const [rl, pl] = await Promise.all([adminApi.roleList(), adminApi.permissionList()]);
  roles.value = rl || [];
  permissions.value = pl || [];
}
function select(r) {
  sel.value = r;
  // role.permissions = RolePermission[] (permission_id)
  checked.value = (r.permissions || []).map((rp) => rp.permission_id);
}
async function savePerms() {
  if (!sel.value) return;
  saving.value = true;
  try {
    await adminApi.rolePermissionSave(sel.value.id, checked.value.map(Number));
    toast.success("권한이 저장되었습니다.");
    await load();
    const again = roles.value.find((x) => x.id === sel.value.id);
    if (again) select(again);
  } catch (e) {
    toast.error(e?.message || "저장 실패");
  } finally {
    saving.value = false;
  }
}
function openNewRole() { newRole.name = ""; newRole.description = ""; rmsg.value = ""; showRole.value = true; }
async function createRole() {
  if (!newRole.name.trim()) { rmsg.value = "역할 이름을 입력하세요."; return; }
  try {
    await adminApi.roleSave({ name: newRole.name.trim(), description: newRole.description.trim() });
    showRole.value = false;
    await load();
  } catch (e) { rmsg.value = e?.message || "저장 실패"; }
}
onMounted(load);
</script>

<style scoped>
.cols { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; }
@media (max-width: 640px) { .cols { grid-template-columns: 1fr; } }
.h { font-family: "Galmuri11", monospace; font-weight: 700; color: var(--ink); }

.rolelist { background: #ffffff; border: 1px solid #d9dbe9; border-radius: 12px; padding: 0.8rem; height: max-content; }
.rl-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.add { height: 30px; padding: 0 0.6rem; border-radius: 8px; font-size: 0.76rem; font-weight: 700; color: #ffffff; background: var(--seal); border: 1px solid #5f3fe0; }
.rl { display: flex; flex-direction: column; gap: 2px; }
.ritem { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.6rem; border-radius: 8px; cursor: pointer; transition: background 0.14s; }
.ritem:hover { background: #ffffff; }
.ritem.on { background: rgba(122,92,255, 0.12); }
.rname { font-weight: 600; color: var(--ink); font-size: 0.9rem; }
.super { font-size: 0.64rem; font-weight: 700; color: var(--seal); background: rgba(122,92,255, 0.12); padding: 0.05rem 0.35rem; border-radius: 999px; }

.perm { background: #ffffff; border: 1px solid #d9dbe9; border-radius: 12px; padding: 1.1rem; min-height: 240px; }
.p-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.pdesc { font-size: 0.82rem; color: #5b607d; margin-top: 0.2rem; }
.supernote { color: #5b607d; font-size: 0.88rem; }
.groups { display: flex; flex-direction: column; gap: 1.1rem; }
.gtitle { font-family: "Galmuri11", monospace; font-weight: 700; font-size: 0.85rem; color: var(--seal); margin-bottom: 0.4rem; padding-bottom: 0.3rem; border-bottom: 1px dashed #d9dbe9; }
.pcheck { display: flex; align-items: center; gap: 0.55rem; padding: 0.3rem 0; font-size: 0.88rem; color: var(--ink); cursor: pointer; }
.pcheck input { width: 16px; height: 16px; accent-color: #7a5cff; }
.pcheck code { margin-left: auto; font-size: 0.72rem; color: #9a9fbb; }
.empty { color: #9a9fbb; font-size: 0.9rem; padding: 2rem 0; text-align: center; }

.save { height: 38px; padding: 0 1.1rem; border-radius: 9px; font-weight: 700; font-size: 0.84rem; color: #ffffff; background: var(--seal-grad); border: 1px solid #5f3fe0; }
.save:hover { filter: brightness(1.05); }
.save:disabled { opacity: 0.6; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20, 16, 13, 0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 400px; max-width: 100%; background: #ffffff; border: 1px solid #d9dbe9; border-radius: 16px; padding: 1.4rem; }
.ph { font-family: "Galmuri11", monospace; font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.msg { margin-top: 0.7rem; font-size: 0.82rem; font-weight: 600; }
.msg.err { color: var(--seal); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.1rem; }
.cancel { height: 38px; padding: 0 1rem; border-radius: 9px; font-weight: 600; color: #5b607d; background: #f0f1f8; border: 1px solid #b9bccf; }
</style>
