<template>
  <div class="mypage">
    <header class="phead">
      <p class="eyebrow">마이페이지</p>
      <h1 class="ttl">마이페이지</h1>
    </header>

    <div class="grid">
      <!-- 프로필 카드 -->
      <section class="card profile">
        <div class="avatar">{{ initial }}</div>
        <div class="pmeta">
          <div class="pname">{{ auth.user?.name || auth.user?.username }}</div>
          <div class="pid">@{{ auth.user?.username }}</div>
          <span class="rolechip">{{ roleLabel }}</span>
        </div>
        <dl class="pdl">
          <dt>이메일</dt><dd>{{ auth.user?.email || "-" }}</dd>
          <dt>권한</dt>
          <dd>
            <template v-if="auth.user?.is_super">전체 권한(슈퍼관리자)</template>
            <template v-else-if="auth.user?.permissions?.length">{{ auth.user.permissions.join(", ") }}</template>
            <template v-else>부여된 권한 없음</template>
          </dd>
        </dl>
      </section>

      <!-- 비밀번호 변경 -->
      <section class="card">
        <h2 class="ch">비밀번호 변경</h2>
        <form class="pwform" @submit.prevent="changePw">
          <label class="fld"><span>현재 비밀번호</span>
            <input v-model="pw.old_password" type="password" autocomplete="current-password" />
          </label>
          <label class="fld"><span>새 비밀번호</span>
            <input v-model="pw.new_password" type="password" autocomplete="new-password" placeholder="영문+숫자 6자 이상" />
          </label>
          <label class="fld"><span>새 비밀번호 확인</span>
            <input v-model="pw.new_confirm_password" type="password" autocomplete="new-password" />
          </label>
          <p v-if="msg" class="msg" :class="{ err: msgErr }">{{ msg }}</p>
          <button class="save" type="submit" :disabled="saving">{{ saving ? "변경 중…" : "비밀번호 변경" }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { reactive, ref, computed } from "vue";
import api from "@/api/api";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const roleLabel = computed(() => auth.user?.role?.name || (auth.user?.is_super ? "슈퍼관리자" : "회원"));
const initial = computed(() => (auth.user?.name || auth.user?.username || "?").slice(0, 1));

const pw = reactive({ old_password: "", new_password: "", new_confirm_password: "" });
const msg = ref("");
const msgErr = ref(false);
const saving = ref(false);

async function changePw() {
  msg.value = "";
  msgErr.value = false;
  if (pw.new_password !== pw.new_confirm_password) {
    msg.value = "새 비밀번호가 일치하지 않습니다.";
    msgErr.value = true;
    return;
  }
  saving.value = true;
  try {
    await api.post("/auth/changePassword", { ...pw });
    msg.value = "비밀번호가 변경되었습니다.";
    pw.old_password = pw.new_password = pw.new_confirm_password = "";
  } catch (e) {
    msg.value = e?.message || "변경에 실패했습니다.";
    msgErr.value = true;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.mypage { max-width: 900px; margin: 0 auto; }
.phead { margin-bottom: 1.25rem; }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); }
.ttl { font-family: "Galmuri11", monospace; font-size: 1.6rem; font-weight: 700; color: var(--ink); margin-top: 0.25rem; }

.grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 1rem; }
@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }

.card {
  background: #ffffff;
  border: 1px solid #d9dbe9;
  border-radius: 14px;
  padding: 1.25rem;
}
.profile { display: flex; flex-direction: column; gap: 0.9rem; }
.avatar {
  width: 62px; height: 62px; display: grid; place-items: center;
  border-radius: 16px;
  font-family: "Galmuri11", monospace; font-weight: 700; font-size: 1.7rem; color: #ffffff;
  background: linear-gradient(145deg, #8a6bff, var(--seal) 55%, #5f3fe0);
  box-shadow: inset 0 0 0 2px rgba(255, 236, 214, 0.6);
}
.pname { font-size: 1.15rem; font-weight: 700; color: var(--ink); }
.pid { font-size: 0.82rem; color: #5b607d; margin-top: 0.1rem; }
.rolechip {
  display: inline-block; margin-top: 0.5rem;
  padding: 0.15rem 0.6rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700; color: var(--seal);
  background: rgba(122,92,255, 0.1);
}
.pdl { display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1rem; font-size: 0.85rem; border-top: 1px dashed #e0d3b5; padding-top: 0.9rem; }
.pdl dt { color: #5b607d; font-weight: 600; }
.pdl dd { color: var(--ink); word-break: break-word; }

.ch { font-family: "Galmuri11", monospace; font-size: 1.05rem; font-weight: 700; color: var(--ink); margin-bottom: 1rem; }
.pwform { display: flex; flex-direction: column; gap: 0.85rem; }
.fld span { display: block; font-size: 0.72rem; font-weight: 700; color: #2c2f45; margin-bottom: 0.35rem; }
.fld input {
  width: 100%; height: 42px; padding: 0 0.8rem; font-size: 0.9rem; color: var(--ink);
  background: #ffffff; border: 1px solid #b9bccf; border-radius: 9px; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.fld input:focus { border-color: var(--seal); box-shadow: 0 0 0 3px rgba(122,92,255, 0.13); }
.msg { font-size: 0.82rem; font-weight: 600; color: #2e7d43; }
.msg.err { color: var(--seal); }
.save {
  margin-top: 0.2rem; height: 44px; border-radius: 9px;
  background: var(--seal-grad);
  color: #ffffff; font-weight: 700; font-size: 0.95rem;
  border: 1px solid #5f3fe0; cursor: pointer; transition: filter 0.15s, transform 0.08s;
}
.save:hover { filter: brightness(1.05); }
.save:active { transform: translateY(1px); }
.save:disabled { opacity: 0.65; }
</style>
