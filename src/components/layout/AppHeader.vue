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
      <RouterLink to="/mypage" class="avatar" :title="'마이페이지'">
        {{ initial }}
      </RouterLink>
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

const title = computed(() => route.meta?.title || "CS ERP");
const roleLabel = computed(
  () => auth.user?.role?.name || (auth.user?.is_super ? "슈퍼관리자" : "회원"),
);
const initial = computed(() => (auth.user?.name || auth.user?.username || "?").slice(0, 1));

function onLogout() {
  auth.logout();
  router.replace("/login");
}
</script>

<style scoped>
.hdr {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem 0 0.75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.left { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.ham {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  color: var(--ink-muted);
  transition: background 0.15s, color 0.15s;
}
.ham:hover { background: var(--surface-2); color: var(--ink); }
.ttl {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.right { display: flex; align-items: center; gap: 0.7rem; }
.who { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }
.who .nm { font-size: 0.86rem; font-weight: 700; color: var(--ink); }
.who .rl {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--seal);
}
.avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.05rem;
  color: #fff;
  text-decoration: none;
  background: var(--seal-grad);
  transition: transform 0.12s;
}
.avatar:hover { transform: translateY(-1px); }
.logout {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  height: 36px;
  padding: 0 0.8rem;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-muted);
  border: 1px solid var(--line);
  background: var(--surface-2);
  transition: background 0.15s, color 0.15s;
}
.logout:hover { background: var(--surface-2); color: var(--ink); }

@media (max-width: 640px) {
  .who { display: none; }
  .lo-txt { display: none; }
  .logout { padding: 0 0.6rem; }
}
</style>
