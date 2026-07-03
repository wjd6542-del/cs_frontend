<template>
  <div class="page">
    <header class="phead">
      <div>
        <h1 class="ttl">{{ $t("화이트 아이피") }}</h1>
        <p class="desc">{{ $t("계정별 접근 허용 IP를 관리합니다. IP 제한을 켜면 허용 IP에서만 로그인·접근할 수 있어요. (슈퍼관리자는 제외)") }}</p>
      </div>
      <button class="btn" @click="load"><i class="fa-solid fa-rotate-right"></i> {{ $t("새로고침") }}</button>
    </header>

    <div class="tablewrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ $t("아이디") }}</th><th>{{ $t("이름") }}</th><th>{{ $t("역할") }}</th>
            <th class="c">{{ $t("IP 접근 제한") }}</th><th class="c">{{ $t("허용 IP") }}</th><th class="c w-act">{{ $t("관리") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!users.length"><td colspan="6"><EmptyState icon="🛡️" :title="$t('계정이 없어요')" :desc="$t('등록된 계정이 아직 없어요.')" compact /></td></tr>
          <tr v-for="u in users" :key="u.id">
            <td class="nm">{{ u.username }} <span v-if="u.is_super" class="superchip">{{ $t("슈퍼") }}</span></td>
            <td>{{ u.name }}</td>
            <td><span class="rolechip">{{ u.role_name || u.role?.name || "-" }}</span></td>
            <td class="c"><span class="st" :class="u.ip_restrict ? 'on' : 'off'">{{ u.ip_restrict ? $t("사용") : $t("미사용") }}</span></td>
            <td class="c muted">{{ u.ip_count ?? "-" }}</td>
            <td class="c"><button class="btn btn-xs" :disabled="u.is_super" :title="u.is_super ? $t('슈퍼관리자는 IP 제한을 적용받지 않습니다.') : ''" @click="openEditor(u)">{{ $t("관리") }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- IP 관리 드로어 -->
    <div v-if="target" class="drawer" @click.self="target = null">
      <div class="panel">
        <button class="vclose" @click="target = null"><i class="fa-solid fa-xmark"></i></button>
        <p class="peyebrow">{{ $t("화이트 아이피") }}</p>
        <h3 class="ph">{{ target.username }} · {{ target.name }}</h3>

        <label class="iptoggle">
          <span class="lbl"><i class="fa-solid fa-shield-halved"></i> {{ $t("IP 접근 제한") }}</span>
          <span class="sw" :class="{ on: ipRestrict }" @click="ipRestrict = !ipRestrict"><span class="knob"></span></span>
          <span class="sh">{{ ipRestrict ? $t("사용 · 허용 IP만 접근") : $t("미사용") }}</span>
        </label>

        <div v-if="ipRestrict" class="iplist">
          <div class="iphead">
            <span class="iplbl">{{ $t("허용 IP 목록") }} <b>{{ rows.length }}</b></span>
            <button class="btn btn-xs" @click="addRow"><i class="fa-solid fa-plus"></i> {{ $t("IP 추가") }}</button>
          </div>
          <div v-if="!rows.length" class="ipnone">{{ $t("등록된 IP가 없어요. 추가하지 않으면 이 계정은 접근이 차단됩니다.") }}</div>
          <div v-for="(r, i) in rows" :key="r._k" class="iprow">
            <input v-model="r.ip" class="ipin" placeholder="203.0.113.5" />
            <input v-model="r.memo" class="ipin memo" :placeholder="$t('메모(회사/재택 등)')" />
            <span class="sw sm" :class="{ on: r.is_active }" @click="r.is_active = !r.is_active" :title="$t('활성')"><span class="knob"></span></span>
            <button class="ipdel" @click="removeRow(i)"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <p class="iphint">{{ $t("저장 후 다음 로그인부터 적용됩니다.") }}</p>
        </div>

        <div class="acts">
          <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? $t("저장 중…") : $t("저장") }}</button>
          <button class="btn" @click="target = null">{{ $t("닫기") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import EmptyState from "@/components/base/EmptyState.vue";
import { adminApi } from "@/api/admin";

const toast = useToast();
const users = ref([]);
const target = ref(null);
const ipRestrict = ref(false);
const rows = ref([]);
const removedIds = ref([]);
const saving = ref(false);
let seq = 0;

async function load() {
  const list = await adminApi.userList({});
  users.value = list || [];
  // 각 계정의 허용 IP 개수 (비-슈퍼만 조회)
  await Promise.all(
    users.value.filter((u) => !u.is_super).map(async (u) => {
      try { u.ip_count = (await adminApi.ipList(u.id))?.length ?? 0; } catch (e) { u.ip_count = 0; }
    }),
  );
}

async function openEditor(u) {
  if (u.is_super) return;
  target.value = u;
  ipRestrict.value = !!u.ip_restrict;
  removedIds.value = [];
  try {
    const list = await adminApi.ipList(u.id);
    rows.value = (list || []).map((r) => ({ _k: `r${r.id}`, id: r.id, ip: r.ip, memo: r.memo || "", is_active: !!r.is_active }));
  } catch (e) { rows.value = []; }
}
function addRow() { rows.value.push({ _k: `n${seq++}`, id: null, ip: "", memo: "", is_active: true }); }
function removeRow(i) { const r = rows.value[i]; if (r?.id) removedIds.value.push(r.id); rows.value.splice(i, 1); }

async function save() {
  if (!target.value) return;
  saving.value = true;
  try {
    const uid = target.value.id;
    await adminApi.ipToggle(uid, ipRestrict.value);
    if (removedIds.value.length) await adminApi.ipBatchDelete(uid, removedIds.value.map((id) => ({ id })));
    const toSave = rows.value.filter((r) => r.ip.trim()).map((r) => ({ ...(r.id ? { id: r.id } : {}), ip: r.ip.trim(), memo: r.memo || null, is_active: r.is_active }));
    if (toSave.length) await adminApi.ipBatchSave(uid, toSave);
    toast.success("저장되었습니다.");
    target.value = null;
    await load();
  } catch (e) { toast.error(e?.message || "저장 실패"); }
  finally { saving.value = false; }
}

onMounted(load);
</script>

<style scoped>
.page { max-width: 960px; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
.ttl { font-family: var(--font-pixel); font-size: 1.3rem; color: var(--ink); }
.desc { font-size: 0.82rem; color: var(--ink-muted); margin-top: 0.3rem; max-width: 640px; }

.tablewrap { border: 2px solid var(--line-hard); border-radius: 4px; overflow: hidden; background: var(--surface); box-shadow: var(--shadow-hard); }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line-strong); font-family: var(--font-pixel); font-size: 0.72rem; color: var(--ink-muted); }
.tbl td { padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); font-size: 0.88rem; color: var(--ink); }
.tbl tbody tr:last-child td { border-bottom: none; }
.c { text-align: center; } .w-act { width: 80px; }
.nm { font-weight: 700; }
.muted { color: var(--ink-muted); }
.superchip { font-size: 0.6rem; font-weight: 700; color: var(--gold); background: rgba(255,159,28,0.14); border: 1px solid var(--line-hard); border-radius: 3px; padding: 0.02rem 0.3rem; margin-left: 0.2rem; }
.rolechip { font-size: 0.74rem; font-weight: 700; color: var(--seal); background: rgba(122,92,255,0.1); padding: 0.1rem 0.5rem; border-radius: 3px; }
.st { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 3px; font-family: var(--font-pixel); }
.st.on { color: #fff; background: var(--flow-in); }
.st.off { color: var(--ink-muted); background: var(--surface-2); border: 1px solid var(--line); }

.drawer { position: fixed; inset: 0; z-index: 210; background: rgba(20,16,13,0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.panel { position: relative; width: 560px; max-width: 100%; max-height: 88vh; overflow-y: auto; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; padding: 1.5rem; box-shadow: var(--shadow-lg); }
.vclose { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border: 2px solid var(--line-hard); border-radius: 3px; color: var(--ink); box-shadow: 2px 2px 0 var(--line-hard); }
.peyebrow { font-family: var(--font-pixel); font-size: 0.62rem; letter-spacing: 0.12em; color: var(--seal-deep); }
.ph { font-family: var(--font-pixel); font-size: 1.1rem; color: var(--ink); margin: 0.2rem 0 1rem; }

.iptoggle { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.8rem; background: var(--surface-2); border: 2px solid var(--line); border-radius: 3px; }
.iptoggle .lbl { font-size: 0.82rem; font-weight: 700; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 0.4rem; }
.iptoggle .lbl i { color: var(--seal); }
.sh { font-size: 0.78rem; color: var(--ink-muted); margin-left: auto; }
.sw { flex-shrink: 0; width: 44px; height: 24px; border-radius: 3px; background: var(--surface); border: 2px solid var(--line-hard); position: relative; cursor: pointer; transition: background 0.18s; }
.sw.on { background: var(--flow-in); }
.sw .knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 2px; background: var(--surface); border: 1px solid var(--line-hard); transition: transform 0.18s; }
.sw.on .knob { transform: translateX(20px); }
.sw.sm { width: 38px; height: 22px; }
.sw.sm .knob { width: 14px; height: 14px; }
.sw.sm.on .knob { transform: translateX(16px); }

.iplist { margin-top: 1rem; }
.iphead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.iplbl { font-family: var(--font-pixel); font-size: 0.74rem; color: var(--ink-soft); }
.iplbl b { color: var(--seal); }
.ipnone { padding: 0.9rem; text-align: center; font-size: 0.8rem; color: var(--ink-faint); background: var(--surface-2); border: 2px dashed var(--line-strong); border-radius: 3px; }
.iprow { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.ipin { height: 34px; padding: 0 0.6rem; font-size: 0.85rem; border: 2px solid var(--line-strong); border-radius: 3px; outline: none; background: var(--surface); color: var(--ink); width: 160px; flex-shrink: 0; }
.ipin.memo { flex: 1; width: auto; }
.ipin:focus { border-color: var(--seal); box-shadow: 0 0 0 2px rgba(122,92,255,0.15); }
.ipdel { width: 30px; height: 30px; flex-shrink: 0; border: 2px solid var(--line-hard); border-radius: 3px; color: var(--danger); background: var(--surface); box-shadow: 2px 2px 0 var(--line-hard); }
.iphint { margin-top: 0.7rem; font-size: 0.74rem; color: var(--ink-faint); }
.acts { display: flex; gap: 0.6rem; margin-top: 1.3rem; }
</style>
