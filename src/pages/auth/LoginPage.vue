<template>
  <div class="login">
    <!-- 좌: 픽셀 콘솔 패널 -->
    <section class="console">
      <div class="scan" aria-hidden="true"></div>

      <div class="top">
        <div class="logo">
          <span class="logo-mark">CS</span>
          <span class="logo-cap">CUSTOMER SERVICE</span>
        </div>
      </div>

      <div class="mid">
        <h2 class="headline">고객센터<br />관리 시스템</h2>
        <p class="lead">지급 · 회수 정산부터 업체 · 게임사 응대까지<br />하나의 콘솔에서.</p>

        <!-- HUD: 넷플로우 미니 -->
        <div class="hud">
          <div class="hud-row">
            <span class="hud-lbl in">▲ 회수</span>
            <span class="hud-bar"><i class="fill in" style="width:72%"></i></span>
          </div>
          <div class="hud-row">
            <span class="hud-lbl out">▼ 지급</span>
            <span class="hud-bar"><i class="fill out" style="width:48%"></i></span>
          </div>
        </div>
      </div>

      <p class="pfoot">© {{ year }} CS · Customer Service</p>
    </section>

    <!-- 우: 로그인 폼 -->
    <section class="formpane">
      <div class="card">
        <div class="m-brand"><span class="logo-mark sm">CS</span></div>

        <p class="eyebrow">SYSTEM LOGIN</p>
        <h1 class="title">로그인</h1>
        <p class="hint">관리자 계정으로 로그인하세요.</p>

        <form class="form" @submit.prevent="onSubmit">
          <label class="fld">
            <span class="lbl">아이디</span>
            <div class="inputwrap">
              <i class="fa-solid fa-user ico"></i>
              <input v-model="username" autocomplete="username" placeholder="아이디를 입력하세요" @keyup.enter="onSubmit" />
            </div>
          </label>

          <label class="fld">
            <span class="lbl">비밀번호</span>
            <div class="inputwrap">
              <i class="fa-solid fa-lock ico"></i>
              <input v-model="password" :type="show ? 'text' : 'password'" autocomplete="current-password" placeholder="비밀번호를 입력하세요" @keyup.enter="onSubmit" />
              <button type="button" class="eye" tabindex="-1" @click="show = !show"><i class="fa-solid" :class="show ? 'fa-eye-slash' : 'fa-eye'"></i></button>
            </div>
          </label>

          <p v-if="error" class="err" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ error }}</p>

          <button class="enter" type="submit" :disabled="loading">
            <span v-if="loading"><i class="fa-solid fa-spinner fa-spin"></i> 접속 중…</span>
            <span v-else>▶ 접속</span>
          </button>
        </form>

        <p class="foot">계정이 없으면 관리자에게 문의하세요.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/api/api";
import { useAuthStore } from "@/stores/auth";

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const show = ref(false);
const year = new Date().getFullYear();
const router = useRouter();
const auth = useAuthStore();

async function onSubmit() {
  if (loading.value) return;
  error.value = "";
  loading.value = true;
  try {
    const { data } = await api.post("/auth/login", { username: username.value, password: password.value });
    auth.login(data);
    router.replace("/");
  } catch (e: any) {
    error.value = e?.message || "아이디 또는 비밀번호를 확인하세요.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; background: var(--paper); }

/* ── 좌: 픽셀 콘솔 ─────────────────────── */
.console {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 3rem 3rem;
  color: #e7e8f1;
  background:
    radial-gradient(60% 45% at 82% 6%, rgba(122, 92, 255, 0.35), transparent 60%),
    radial-gradient(55% 45% at 6% 100%, rgba(14, 168, 143, 0.16), transparent 60%),
    #16182a;
  border-right: 3px solid var(--line-hard);
}
/* CRT 스캔라인 */
.scan {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.18) 0 2px, transparent 2px 4px);
  mask-image: radial-gradient(120% 100% at 50% 40%, #000 60%, transparent 100%);
}
.top, .mid, .pfoot { position: relative; z-index: 1; }

.logo { display: flex; align-items: center; gap: 0.8rem; }
.logo-mark {
  display: grid; place-items: center; width: 56px; height: 56px;
  font-family: var(--font-pixel); font-size: 1.4rem; font-weight: 700; color: #fff;
  background: var(--seal); border: 3px solid #0d0e1a;
  box-shadow: 4px 4px 0 #0d0e1a; letter-spacing: 0.02em;
}
.logo-cap { font-family: var(--font-pixel); font-size: 0.7rem; letter-spacing: 0.18em; color: rgba(231, 232, 241, 0.6); }

.headline { font-family: var(--font-pixel); font-size: clamp(1.7rem, 3.4vw, 2.5rem); line-height: 1.35; color: #fff; text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.35); }
.lead { margin-top: 1.1rem; font-size: 0.95rem; line-height: 1.7; color: rgba(231, 232, 241, 0.66); }

.hud { margin-top: 2rem; display: flex; flex-direction: column; gap: 0.7rem; max-width: 340px; }
.hud-row { display: flex; align-items: center; gap: 0.7rem; }
.hud-lbl { font-family: var(--font-pixel); font-size: 0.72rem; width: 68px; }
.hud-lbl.in { color: #2fe0c4; } .hud-lbl.out { color: #ffb25e; }
.hud-bar { flex: 1; height: 14px; background: rgba(255, 255, 255, 0.08); border: 2px solid #0d0e1a; position: relative; }
.hud-bar .fill { position: absolute; inset: 0; height: 100%; }
.fill.in { background: repeating-linear-gradient(90deg, #12b8a6 0 6px, #0ea88f 6px 8px); }
.fill.out { background: repeating-linear-gradient(90deg, #ff9f1c 0 6px, #e07d16 6px 8px); }

.pfoot { font-family: var(--font-pixel); font-size: 0.66rem; letter-spacing: 0.08em; color: rgba(154, 159, 187, 0.55); }

/* ── 우: 폼 ─────────────────────────── */
.formpane { display: grid; place-items: center; padding: 2.5rem; background: var(--surface); }
.card { width: 100%; max-width: 380px; }
.m-brand { display: none; margin-bottom: 1.4rem; }
.logo-mark.sm { width: 44px; height: 44px; font-size: 1.05rem; box-shadow: 3px 3px 0 #0d0e1a; }

.eyebrow { font-family: var(--font-pixel); font-size: 0.7rem; letter-spacing: 0.16em; color: var(--seal-deep); }
.title { margin-top: 0.5rem; font-family: var(--font-pixel); font-size: 1.7rem; color: var(--ink); }
.hint { margin-top: 0.5rem; font-size: 0.88rem; color: var(--ink-muted); }

.form { margin-top: 2rem; display: flex; flex-direction: column; gap: 1.05rem; }
.fld { display: block; }
.lbl { display: block; font-family: var(--font-pixel); font-size: 0.72rem; color: var(--ink-soft); margin-bottom: 0.45rem; }
.inputwrap { position: relative; display: flex; align-items: center; }
.inputwrap .ico { position: absolute; left: 0.85rem; font-size: 0.85rem; color: var(--ink-faint); pointer-events: none; }
.inputwrap input {
  width: 100%; height: 50px; padding: 0 2.6rem; font-size: 0.95rem; color: var(--ink);
  background: var(--surface-2); border: 2px solid var(--line-hard); border-radius: 3px; outline: none;
  transition: box-shadow 0.12s, background 0.12s;
}
.inputwrap input::placeholder { color: var(--ink-faint); }
.inputwrap input:focus { background: #fff; box-shadow: var(--ring); border-color: var(--seal); }
.eye { position: absolute; right: 0.5rem; width: 34px; height: 34px; color: var(--ink-faint); }
.eye:hover { color: var(--ink-muted); }

.err { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--danger); font-weight: 700; }

.enter {
  margin-top: 0.4rem; height: 52px; font-family: var(--font-pixel); font-size: 0.95rem; letter-spacing: 0.02em;
  color: #fff; background: var(--seal); border: 2px solid var(--line-hard); border-radius: 3px; cursor: pointer;
  box-shadow: 4px 4px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s, background 0.12s;
}
.enter:hover { background: #8a6bff; transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--line-hard); }
.enter:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--line-hard); }
.enter:disabled { opacity: 0.6; cursor: default; }

.foot { margin-top: 1.6rem; font-size: 0.8rem; color: var(--ink-faint); text-align: center; }

@media (max-width: 860px) {
  .login { grid-template-columns: 1fr; }
  .console { display: none; }
  .m-brand { display: block; }
  .formpane { align-items: flex-start; padding-top: 4rem; }
}
</style>
