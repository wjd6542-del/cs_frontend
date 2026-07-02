<template>
  <div class="login">
    <!-- 시그니처: 먹·한지 패널 + 세로쓰기 族譜 + 낙관 인장 -->
    <section class="ink">
      <div class="lattice" aria-hidden="true"></div>
      <div class="brand">
        <div class="vert">族譜</div>
        <div class="seal" aria-hidden="true">
          <span>譜</span>
        </div>
      </div>
      <div class="tagline">
        <p class="line">한 사람에서 비롯된 이름들</p>
        <p class="sub">고객센터 관리 ERP</p>
      </div>
    </section>

    <!-- 한지 위 로그인 폼 -->
    <section class="paper">
      <div class="card">
        <p class="eyebrow">CS ERP</p>
        <h1 class="title">CS ERP 로그인</h1>
        <p class="hint">관리자 계정으로 로그인하세요.</p>

        <form class="form" @submit.prevent="onSubmit">
          <label class="fld">
            <span class="lbl">아이디</span>
            <input
              v-model="username"
              autocomplete="username"
              placeholder="아이디를 입력하세요"
              @keyup.enter="onSubmit"
            />
          </label>

          <label class="fld">
            <span class="lbl">비밀번호</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="비밀번호를 입력하세요"
              @keyup.enter="onSubmit"
            />
          </label>

          <p v-if="error" class="err" role="alert">{{ error }}</p>

          <button class="enter" type="submit" :disabled="loading">
            {{ loading ? "확인하는 중…" : "들어가기" }}
          </button>
        </form>

        <p class="foot">
          <span class="dot" aria-hidden="true"></span>
          계정이 없으면 관리자에게 문의하세요.
        </p>
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
const router = useRouter();
const auth = useAuthStore();

async function onSubmit() {
  if (loading.value) return;
  error.value = "";
  loading.value = true;
  try {
    const { data } = await api.post("/auth/login", {
      username: username.value,
      password: password.value,
    });
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
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: var(--hanji);
  color: var(--ink);
}

/* ── 좌: 먹 패널 ───────────────────────────── */
.ink {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3.5rem 3rem;
  color: #efe6d2;
  background:
    radial-gradient(120% 90% at 78% 8%, #2c2620 0%, transparent 55%),
    radial-gradient(140% 120% at 12% 100%, #241f1a 0%, transparent 60%),
    linear-gradient(155deg, #211c18 0%, var(--ink) 60%, #14100d 100%);
}
/* 창호(살) 결 — 아주 옅은 격자 */
.lattice {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    repeating-linear-gradient(0deg, rgba(233, 221, 194, 0.05) 0 1px, transparent 1px 34px),
    repeating-linear-gradient(90deg, rgba(233, 221, 194, 0.045) 0 1px, transparent 1px 34px);
  -webkit-mask-image: radial-gradient(120% 100% at 50% 40%, #000 55%, transparent 100%);
  mask-image: radial-gradient(120% 100% at 50% 40%, #000 55%, transparent 100%);
}

.brand {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vert {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: "Noto Serif KR", serif;
  font-weight: 700;
  font-size: clamp(6rem, 15vw, 12rem);
  line-height: 0.9;
  letter-spacing: 0.08em;
  color: #f2e9d5;
  text-shadow: 0 2px 30px rgba(0, 0, 0, 0.55);
}
/* 낙관(도장) — 시그니처 포인트 */
.seal {
  position: absolute;
  right: 20%;
  bottom: 12%;
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(145deg, #c24334, var(--seal) 55%, #97281f);
  box-shadow:
    inset 0 0 0 3px rgba(255, 236, 214, 0.85),
    inset 0 0 0 6px var(--seal),
    0 10px 26px rgba(120, 26, 20, 0.45);
  transform: rotate(-6deg);
  animation: stamp 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.2) 0.15s both;
}
.seal span {
  font-family: "Noto Serif KR", serif;
  font-weight: 900;
  font-size: 2.7rem;
  color: #ffefe0;
}
@keyframes stamp {
  0% { opacity: 0; transform: rotate(-6deg) scale(1.35); }
  60% { opacity: 1; }
  100% { opacity: 1; transform: rotate(-6deg) scale(1); }
}

.tagline {
  position: relative;
}
.tagline .line {
  font-family: "Noto Serif KR", serif;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f0e7d3;
}
.tagline .sub {
  margin-top: 0.4rem;
  font-size: 0.9rem;
  color: rgba(233, 221, 194, 0.6);
  letter-spacing: 0.02em;
}

/* ── 우: 한지 폼 패널 ─────────────────────── */
.paper {
  position: relative;
  display: grid;
  place-items: center;
  padding: 2.5rem;
  background:
    repeating-linear-gradient(94deg, rgba(120, 90, 40, 0.035) 0 2px, transparent 2px 7px),
    var(--hanji);
}
.card {
  width: 100%;
  max-width: 360px;
}
.eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--seal);
}
.title {
  margin-top: 0.65rem;
  font-family: "Noto Serif KR", serif;
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.hint {
  margin-top: 0.4rem;
  font-size: 0.86rem;
  color: #6f6455;
}

.form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.fld {
  display: block;
}
.lbl {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #7a6e5c;
  margin-bottom: 0.4rem;
}
.fld input {
  width: 100%;
  height: 46px;
  padding: 0 0.9rem;
  font-size: 0.95rem;
  color: var(--ink);
  background: rgba(255, 253, 247, 0.75);
  border: 1px solid #cdbf9f;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.fld input::placeholder {
  color: #a99c84;
}
.fld input:focus {
  border-color: var(--seal);
  background: #fffdf7;
  box-shadow: 0 0 0 3px rgba(178, 58, 46, 0.14);
}

.err {
  font-size: 0.82rem;
  color: var(--seal);
  font-weight: 600;
}

.enter {
  margin-top: 0.3rem;
  height: 48px;
  border-radius: 10px;
  border: 1px solid #8e2a20;
  background: var(--seal-grad);
  color: #fdefe2;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.08s, filter 0.15s, box-shadow 0.15s;
  box-shadow: 0 8px 20px rgba(150, 40, 32, 0.28);
}
.enter:hover {
  filter: brightness(1.05);
}
.enter:active {
  transform: translateY(1px) scale(0.995);
}
.enter:disabled {
  opacity: 0.65;
  cursor: default;
}
.enter:focus-visible {
  outline: 3px solid rgba(178, 58, 46, 0.35);
  outline-offset: 2px;
}

.foot {
  margin-top: 1.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: #857a68;
}
.foot .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
}

/* ── 반응형 ───────────────────────────────── */
@media (max-width: 860px) {
  .login {
    grid-template-columns: 1fr;
  }
  .ink {
    min-height: 220px;
    padding: 1.75rem;
    flex-direction: row;
    align-items: center;
    gap: 1.25rem;
  }
  .brand {
    flex: 0 0 auto;
  }
  .vert {
    writing-mode: horizontal-tb;
    font-size: 3.4rem;
  }
  .seal {
    right: -6px;
    bottom: -6px;
    width: 58px;
    height: 58px;
  }
  .seal span {
    font-size: 1.7rem;
  }
  .tagline .line {
    font-size: 1.05rem;
  }
  .tagline .sub {
    font-size: 0.78rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .seal {
    animation: none;
  }
}
</style>
