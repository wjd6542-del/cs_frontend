<template>
  <header class="hdr">
    <div class="left">
      <button class="ham" aria-label="메뉴" @click="emit('toggle')">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h1 class="ttl">{{ title }}</h1>
    </div>

    <div class="right">
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits(["toggle"]);
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const title = computed(() => route.meta?.title || "CS");
const roleLabel = computed(() => auth.user?.role?.name || (auth.user?.is_super ? "슈퍼관리자" : "회원"));
const initial = computed(() => (auth.user?.name || auth.user?.username || "?").slice(0, 1));

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
