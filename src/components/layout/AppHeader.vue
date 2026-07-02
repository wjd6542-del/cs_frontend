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

      <div class="who">
        <span class="nm">{{ auth.user?.name || auth.user?.username }}</span>
        <span class="rl">{{ roleLabel }}</span>
      </div>
      <RouterLink to="/mypage" class="avatar" :title="'마이페이지'">{{ initial }}</RouterLink>
      <button class="logout" @click="onLogout">
        <i class="fa-solid fa-right-from-bracket"></i>
        <span class="lo-txt">로그아웃</span>
      </button>
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
function toggleBell() { bellOpen.value = !bellOpen.value; if (bellOpen.value) alerts.fetch(); }
function openTicket(t) {
  bellOpen.value = false;
  const path = t.party === "VENDOR" ? "/support/vendor" : "/support/gameco";
  router.push({ path, query: { open: t.id } });
}
function onOutside(e) { if (bellWrap.value && !bellWrap.value.contains(e.target)) bellOpen.value = false; }

onMounted(() => {
  document.addEventListener("click", onOutside, true);
  if (auth.user) alerts.fetch();
});
onBeforeUnmount(() => document.removeEventListener("click", onOutside, true));
// 라우트 이동 시 알림 카운트 갱신 (응대 처리 후 반영)
watch(() => route.fullPath, () => { if (auth.user) alerts.fetch(); });

function onLogout() {
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
.who { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }
.who .nm { font-size: 0.86rem; font-weight: 700; color: var(--ink); }
.who .rl { font-family: var(--font-pixel); font-size: 0.6rem; letter-spacing: 0.06em; color: var(--seal-deep); }
.avatar {
  width: 40px; height: 40px; display: grid; place-items: center; font-family: var(--font-pixel);
  font-weight: 700; font-size: 1rem; color: #fff; text-decoration: none;
  background: var(--seal); border: 2px solid var(--line-hard); box-shadow: 2px 2px 0 var(--line-hard);
  transition: transform 0.08s, box-shadow 0.08s;
}
.avatar:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.logout {
  display: flex; align-items: center; gap: 0.4rem; height: 38px; padding: 0 0.8rem;
  font-size: 0.8rem; font-weight: 700; color: var(--ink); border: 2px solid var(--line-hard);
  border-radius: 3px; background: var(--surface); box-shadow: 2px 2px 0 var(--line-hard);
  transition: transform 0.08s, box-shadow 0.08s;
}
.logout:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.logout:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--line-hard); }

@media (max-width: 640px) { .who { display: none; } .lo-txt { display: none; } .logout { padding: 0 0.6rem; } }
</style>
