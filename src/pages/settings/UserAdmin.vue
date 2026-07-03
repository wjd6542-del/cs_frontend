<template>
  <div class="uadmin">
    <div class="head">
      <h3 class="h">{{ $t("계정") }} <span class="c">{{ users.length }}</span></h3>
      <button class="btn btn-primary" @click="openNew"><i class="fa-solid fa-plus"></i> {{ $t("계정 추가") }}</button>
    </div>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr><th>{{ $t("아이디") }}</th><th>{{ $t("이름") }}</th><th>{{ $t("역할") }}</th><th class="c">{{ $t("상태") }}</th><th class="c w-act">{{ $t("수정") }}</th></tr>
        </thead>
        <tbody>
          <tr v-if="!users.length"><td colspan="5"><EmptyState icon="👤" :title="$t('계정이 없어요')" :desc="$t('등록된 계정이 아직 없어요.')" :hint="$t('＋ 계정 추가로 시작해요')" compact /></td></tr>
          <tr v-for="u in users" :key="u.id">
            <td class="nm">{{ u.username }}</td>
            <td>{{ u.name }}</td>
            <td><span class="rolechip">{{ u.role_name || "-" }}</span></td>
            <td class="c"><span class="st" :class="u.is_active ? 'on' : 'off'">{{ u.is_active ? "활성" : "정지" }}</span></td>
            <td class="c"><button class="btn btn-xs" @click="openEdit(u)">{{ $t("수정") }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 폼 -->
    <div v-if="showForm" class="drawer" @click.self="showForm = false">
      <div class="panel">
        <h4 class="ph">{{ editing ? "계정 수정" : "계정 추가" }}</h4>
        <div class="grid">
          <BaseInput v-model="form.username" :label="$t('아이디')" :disabled="editing" :placeholder="$t('영문·숫자')" />
          <BaseInput v-model="form.name" :label="$t('이름')" />
          <div class="fld">
            <label class="lbl">{{ $t("역할") }}</label>
            <SearchSelect v-model="form.role_id" :options="roleOptions" :placeholder="$t('역할 선택')" />
          </div>
          <template v-if="!editing">
            <BaseInput v-model="form.password" :label="$t('비밀번호')" type="password" :placeholder="$t('영문+숫자 6자 이상')" />
            <BaseInput v-model="form.passwordConfirm" :label="$t('비밀번호 확인')" type="password" />
          </template>
          <label class="fld toggle">
            <span class="lbl">{{ $t("상태") }}</span>
            <span class="sw" :class="{ on: form.is_active }" @click="form.is_active = !form.is_active"><span class="knob"></span></span>
            <span class="sh">{{ form.is_active ? "활성" : "정지" }}</span>
          </label>
        </div>
        <p v-if="msg" class="msg err">{{ msg }}</p>
        <div class="acts">
          <button class="btn btn-primary" :disabled="saving" @click="submit">{{ saving ? "저장 중…" : "저장" }}</button>
          <button class="btn" @click="showForm = false">{{ $t("취소") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import EmptyState from "@/components/base/EmptyState.vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import BaseInput from "@/components/base/BaseInput.vue";
import SearchSelect from "@/components/base/SearchSelect.vue";
import { adminApi } from "@/api/admin";

const toast = useToast();
const users = ref([]);
const roles = ref([]);
const roleOptions = computed(() => roles.value.map((r) => ({ value: r.id, label: r.name })));

const showForm = ref(false);
const editing = ref(false);
const saving = ref(false);
const msg = ref("");
const form = reactive({ id: null, username: "", name: "", role_id: null, is_active: true, password: "", passwordConfirm: "" });

async function load() {
  const [u, r] = await Promise.all([adminApi.userList({}), adminApi.roleAllList()]);
  users.value = u || [];
  roles.value = r || [];
}
function openNew() {
  editing.value = false;
  Object.assign(form, { id: null, username: "", name: "", role_id: roles.value[0]?.id ?? null, is_active: true, password: "", passwordConfirm: "" });
  msg.value = "";
  showForm.value = true;
}
function openEdit(u) {
  editing.value = true;
  Object.assign(form, { id: u.id, username: u.username, name: u.name, role_id: u.role_id, is_active: !!u.is_active, password: "", passwordConfirm: "" });
  msg.value = "";
  showForm.value = true;
}
async function submit() {
  msg.value = "";
  saving.value = true;
  try {
    const role_id = Number(form.role_id);
    if (editing.value) {
      await adminApi.userUpdate({ id: form.id, username: form.username, name: form.name, role_id, is_active: form.is_active });
    } else {
      await adminApi.userCreate({ name: form.name, username: form.username, password: form.password, passwordConfirm: form.passwordConfirm, role_id, is_active: form.is_active });
    }
    toast.success("저장되었습니다.");
    showForm.value = false;
    await load();
  } catch (e) {
    msg.value = e?.message || "저장 실패";
  } finally {
    saving.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem; }
.h { font-family: "Galmuri11", monospace; font-weight: 700; color: var(--ink); }
.c { color: var(--seal); margin-left: 0.25rem; }

.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: #ffffff; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid #b9bccf; font-family: "Galmuri11", monospace; font-weight: 700; font-size: 0.8rem; color: #5b607d; }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid #d9dbe9; font-size: 0.88rem; color: #1b1d2e; }
.tbl tbody tr:last-child td { border-bottom: none; }
.c { text-align: center; }
.w-act { width: 70px; }
.nm { font-weight: 700; color: var(--ink); }
.muted { color: #5b607d; }
.state { text-align: center; padding: 1.6rem 0; color: #9a9fbb; }
.rolechip { font-size: 0.74rem; font-weight: 700; color: var(--seal); background: rgba(122,92,255, 0.1); padding: 0.1rem 0.5rem; border-radius: 3px; }
.st { font-size: 0.74rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; }
.st.on { color: #2e7d43; background: rgba(46, 125, 67, 0.12); }
.st.off { color: #9a8d76; background: #d9dbe9; }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20, 16, 13, 0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { width: 460px; max-width: 100%; background: #ffffff; border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.4rem; box-shadow: var(--shadow-lg); }
.ph { font-family: "Galmuri11", monospace; font-size: 1.15rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
.fld { display: block; }
.lbl { display: block; font-size: 0.72rem; font-weight: 700; color: #2c2f45; margin-bottom: 0.4rem; }
.toggle { display: flex; align-items: center; gap: 0.6rem; }
.toggle .lbl { margin-bottom: 0; }
.sw { width: 44px; height: 24px; border-radius: 3px; background: var(--surface-2); border: 2px solid var(--line-hard); position: relative; cursor: pointer; transition: background 0.18s; }
.sw.on { background: #2e7d43; }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 2px; background: #fff; border: 1px solid var(--line-hard); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.sh { font-size: 0.78rem; color: #5b607d; }
.msg { margin-top: 0.8rem; font-size: 0.82rem; font-weight: 600; }
.msg.err { color: var(--danger); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
