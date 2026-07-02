<template>
  <header class="hdr">
    <div class="left">
      <button class="ham" aria-label="메뉴" @click="emit('toggle')">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h1 class="ttl">{{ title }}</h1>
    </div>

    <div class="right">
      <!-- 알림 벨 -->
      <div ref="bellWrap" class="bell-wrap">
        <button class="bell" :class="{ has: alerts.total > 0 }" title="알림" @click="toggleBell">
          <i class="fa-solid fa-bell"></i>
          <span v-if="alerts.total > 0" class="badge">{{ alerts.total > 99 ? '99+' : alerts.total }}</span>
        </button>

        <div v-if="bellOpen" class="dropdown">
          <div class="dhead">
            <span class="dt">알림 <b>{{ alerts.total }}</b></span>
            <RouterLink to="/alerts" class="dall" @click="bellOpen = false">전체보기 ›</RouterLink>
          </div>
          <div class="dlist">
            <div v-if="!alerts.rows.length" class="dnone">🔔 미해결 응대가 없어요!</div>
            <button v-for="t in alerts.rows.slice(0, 8)" :key="t.id" class="drow" @click="openTicket(t)">
              <span class="dp" :class="t.party === 'VENDOR' ? 'v' : 'g'">{{ t.party === 'VENDOR' ? '업체' : '게임사' }}</span>
              <span class="dti">{{ t.title }}</span>
              <span class="dst" :class="t.status === 'OPEN' ? 'o' : 'i'">{{ t.status === 'OPEN' ? '접수' : '처리중' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 계정 드롭다운 -->
      <div ref="acctWrap" class="acct-wrap">
        <button class="acct" :class="{ on: acctOpen }" @click="toggleAcct">
          <div class="who">
            <span class="nm">{{ auth.user?.name || auth.user?.username }}</span>
            <span class="rl">{{ roleLabel }}</span>
          </div>
          <div class="avatar">{{ initial }}</div>
          <i class="fa-solid fa-chevron-down acc-chev" :class="{ up: acctOpen }"></i>
        </button>

        <div v-if="acctOpen" class="dropdown acct-dd">
          <div class="acc-head">
            <div class="avatar sm">{{ initial }}</div>
            <div class="acc-who">
              <div class="acc-name">{{ auth.user?.name || auth.user?.username }}</div>
              <div class="acc-id">@{{ auth.user?.username }} · {{ roleLabel }}</div>
            </div>
          </div>
          <RouterLink to="/mypage" class="acc-item" @click="acctOpen = false"><i class="fa-solid fa-id-card"></i> 마이페이지</RouterLink>
          <button class="acc-item danger" @click="onLogout"><i class="fa-solid fa-right-from-bracket"></i> 로그아웃</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAlertsStore } from "@/stores/alerts";

const emit = defineEmits(["toggle"]);
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const alerts = useAlertsStore();

const title = computed(() => route.meta?.title || "CS");
const roleLabel = computed(() => auth.user?.role?.name || (auth.user?.is_super ? "슈퍼관리자" : "회원"));
const initial = computed(() => (auth.user?.name || auth.user?.username || "?").slice(0, 1));

const bellOpen = ref(false);
const bellWrap = ref(null);
const acctOpen = ref(false);
const acctWrap = ref(null);
function toggleBell() { bellOpen.value = !bellOpen.value; acctOpen.value = false; if (bellOpen.value) alerts.fetch(); }
function toggleAcct() { acctOpen.value = !acctOpen.value; bellOpen.value = false; }
function openTicket(t) {
  bellOpen.value = false;
  const path = t.party === "VENDOR" ? "/support/vendor" : "/support/gameco";
  router.push({ path, query: { open: t.id } });
}
function onOutside(e) {
  if (bellWrap.value && !bellWrap.value.contains(e.target)) bellOpen.value = false;
  if (acctWrap.value && !acctWrap.value.contains(e.target)) acctOpen.value = false;
}

onMounted(() => {
  document.addEventListener("click", onOutside, true);
  if (auth.user) alerts.fetch();
});
onBeforeUnmount(() => document.removeEventListener("click", onOutside, true));
// 라우트 이동 시 알림 카운트 갱신 (응대 처리 후 반영)
watch(() => route.fullPath, () => { if (auth.user) alerts.fetch(); });

function onLogout() {
  acctOpen.value = false;
  auth.logout();
  router.replace("/login");
}
</script>

<style scoped>
.hdr {
  height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 1rem 0 0.75rem; background: var(--surface); border-bottom: 3px solid var(--line-hard);
}
.left { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
.ham { width: 36px; height: 36px; border: 2px solid var(--line-hard); border-radius: 3px; color: var(--ink); background: var(--surface); box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s; }
.ham:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.ham:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--line-hard); }
.ttl { font-family: var(--font-pixel); font-size: 1.05rem; color: var(--ink); letter-spacing: 0.02em; white-space: nowrap; }

.right { display: flex; align-items: center; gap: 0.7rem; }

/* 알림 벨 */
.bell-wrap { position: relative; }
.bell { position: relative; width: 40px; height: 40px; border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface); color: var(--ink); box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s; }
.bell:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.bell.has { color: var(--seal); }
.bell .badge { position: absolute; top: -7px; right: -7px; min-width: 18px; height: 18px; padding: 0 3px; display: grid; place-items: center; font-family: var(--font-pixel); font-size: 0.58rem; color: #fff; background: var(--danger); border: 2px solid var(--line-hard); border-radius: 3px; }

.dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 320px; max-width: 84vw; z-index: 80; background: #fff; border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: 4px 4px 0 var(--line-hard); overflow: hidden; }
.dhead { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line); }
.dt { font-family: var(--font-pixel); font-size: 0.78rem; color: var(--ink); }
.dt b { color: var(--seal); }
.dall { font-size: 0.74rem; color: var(--ink-muted); text-decoration: none; }
.dall:hover { color: var(--seal); }
.dlist { max-height: 60vh; overflow-y: auto; }
.dnone { padding: 1.4rem; text-align: center; color: var(--ink-faint); font-size: 0.85rem; }
.drow { width: 100%; display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); text-align: left; background: #fff; }
.drow:last-child { border-bottom: none; }
.drow:hover { background: var(--surface-2); }
.dp { flex-shrink: 0; font-family: var(--font-pixel); font-size: 0.6rem; padding: 0.1rem 0.35rem; border: 1px solid var(--line-hard); border-radius: 3px; }
.dp.v { color: var(--flow-in); background: var(--flow-in-bg); }
.dp.g { color: var(--seal-deep); background: #ede9ff; }
.dti { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.84rem; font-weight: 600; color: var(--ink); }
.dst { flex-shrink: 0; font-family: var(--font-pixel); font-size: 0.58rem; }
.dst.o { color: #b45309; } .dst.i { color: var(--seal-deep); }
/* 계정 트리거 */
.acct-wrap { position: relative; }
.acct {
  display: flex; align-items: center; gap: 0.6rem; height: 44px; padding: 0 0.5rem 0 0.7rem;
  border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface);
  box-shadow: 2px 2px 0 var(--line-hard); transition: transform 0.08s, box-shadow 0.08s;
}
.acct:hover, .acct.on { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.who { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }
.who .nm { font-size: 0.84rem; font-weight: 700; color: var(--ink); }
.who .rl { font-family: var(--font-pixel); font-size: 0.58rem; letter-spacing: 0.04em; color: var(--seal-deep); }
.avatar {
  width: 34px; height: 34px; display: grid; place-items: center; font-family: var(--font-pixel);
  font-weight: 700; font-size: 0.9rem; color: #fff;
  background: var(--seal); border: 2px solid var(--line-hard); border-radius: 3px;
}
.avatar.sm { width: 40px; height: 40px; font-size: 1rem; box-shadow: 2px 2px 0 var(--line-hard); }
.acc-chev { font-size: 0.62rem; color: var(--ink-faint); transition: transform 0.2s; }
.acc-chev.up { transform: rotate(180deg); }

.acct-dd { width: 240px; }
.acc-head { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem; background: var(--surface-2); border-bottom: 2px solid var(--line); }
.acc-name { font-family: var(--font-pixel); font-size: 0.85rem; color: var(--ink); }
.acc-id { font-size: 0.72rem; color: var(--ink-muted); margin-top: 0.15rem; }
.acc-item { width: 100%; display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.9rem; font-size: 0.88rem; font-weight: 600; color: var(--ink); text-decoration: none; background: #fff; border-bottom: 1px solid var(--line); }
.acc-item:last-child { border-bottom: none; }
.acc-item i { width: 18px; text-align: center; color: var(--ink-muted); }
.acc-item:hover { background: var(--surface-2); color: var(--seal); }
.acc-item:hover i { color: var(--seal); }
.acc-item.danger:hover { color: var(--danger); }
.acc-item.danger:hover i { color: var(--danger); }

@media (max-width: 640px) { .who { display: none; } .acct { padding: 0 0.4rem; } }
</style>
