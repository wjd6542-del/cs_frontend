<template>
  <div class="bview">
    <header class="phead">
      <div>
        <p class="eyebrow">게시판</p>
        <h1 class="ttl">{{ board?.name }}</h1>
        <p v-if="board?.description" class="desc">{{ board.description }}</p>
      </div>
      <router-link v-if="canWrite" :to="`/board/${slug}/write`" class="write"><i class="fa-solid fa-pen"></i> 글쓰기</router-link>
    </header>

    <div class="cards">
      <!-- 공지 -->
      <router-link v-for="p in notices" :key="'n' + p.id" :to="`/post/${p.id}`" class="card notice">
        <span class="pin"><i class="fa-solid fa-thumbtack"></i> 공지</span>
        <PostCardBody :post="p" />
      </router-link>
      <!-- 일반 -->
      <router-link v-for="p in rows" :key="p.id" :to="`/post/${p.id}`" class="card">
        <PostCardBody :post="p" />
      </router-link>
    </div>

    <div v-if="!loading && !notices.length && !rows.length" class="empty">첫 글을 남겨보세요.</div>
    <div ref="sentinel" class="sentinel"></div>
    <div v-if="loading" class="loading">불러오는 중…</div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onBeforeUnmount, watch, h } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { boardApi, mediaUrl } from "@/api/board";
import { formatDateDot as fmt } from "@/utils/date";

// 간단 카드 본문 컴포넌트 (인라인)
const PostCardBody = {
  props: ["post"],
  setup(props) {
    return () =>
      h("div", { class: "cbody" }, [
        props.post.thumb ? h("div", { class: "thumb", style: `background-image:url(${mediaUrl(props.post.thumb)})` }) : null,
        h("div", { class: "ctxt" }, [
          h("div", { class: "cti" }, props.post.title),
          h("div", { class: "cmeta" }, [
            h("span", props.post.author),
            h("span", { class: "dot" }, "·"),
            h("span", fmt(props.post.created_at)),
            props.post.comment_count ? h("span", { class: "cc" }, ` 💬 ${props.post.comment_count}`) : null,
            h("span", { class: "vc" }, ` 👁 ${props.post.view_count}`),
          ]),
        ]),
      ]);
  },
};
const route = useRoute();
const auth = useAuthStore();
const slug = computed(() => route.params.slug);
const board = ref(null);
const notices = ref([]);
const rows = ref([]);
const cursor = ref(null);
const done = ref(false);
const loading = ref(false);
const sentinel = ref(null);
let io;

const canWrite = computed(() => {
  if (!board.value || !auth.user) return false;
  if (board.value.write_level === "ADMIN") return !!auth.user.is_super;
  return true;
});

async function loadBoard() {
  board.value = await boardApi.get(slug.value);
  notices.value = [];
  rows.value = [];
  cursor.value = null;
  done.value = false;
  await loadMore(true);
}
async function loadMore(first = false) {
  if (loading.value || (done.value && !first)) return;
  loading.value = true;
  try {
    const res = await boardApi.postList(board.value.id, cursor.value, 20);
    if (first) notices.value = res.notices || [];
    rows.value.push(...(res.rows || []));
    cursor.value = res.nextCursor;
    if (!res.nextCursor) done.value = true;
  } finally {
    loading.value = false;
  }
}

function setupObserver() {
  io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore();
  }, { rootMargin: "300px" });
  if (sentinel.value) io.observe(sentinel.value);
}

onMounted(async () => { await loadBoard(); setupObserver(); });
onBeforeUnmount(() => io && io.disconnect());
watch(slug, loadBoard);
</script>

<style scoped>
.bview { max-width: 900px; margin: 0 auto; }
.phead { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.1rem; gap: 1rem; }
.back { font-size: 0.78rem; color: #5b607d; text-decoration: none; }
.back:hover { color: var(--seal); }
.eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; color: var(--seal); }
.ttl { font-family: "Galmuri11", monospace; font-size: 1.6rem; font-weight: 700; color: var(--ink); margin-top: 0.25rem; }
.desc { font-size: 0.85rem; color: #5b607d; margin-top: 0.2rem; }
.write {
  flex-shrink: 0; height: 40px; padding: 0 1.1rem; border-radius: 10px; display: inline-flex; align-items: center; gap: 0.4rem;
  font-weight: 700; font-size: 0.86rem; color: #ffffff; text-decoration: none;
  background: var(--seal-grad); border: 1px solid #5f3fe0;
}
.write:hover { filter: brightness(1.05); }

.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }
@media (max-width: 640px) { .cards { grid-template-columns: 1fr; } }
.card {
  display: block; background: #ffffff; border: 1px solid #d9dbe9; border-radius: 14px; overflow: hidden;
  text-decoration: none; transition: transform 0.12s, box-shadow 0.15s, border-color 0.15s;
}
.card:hover { transform: translateY(-2px); border-color: #d9b7a2; box-shadow: 0 8px 20px rgba(27,29,46,0.14); }
.card.notice { border-color: #e0b6a8; }
.pin { display: inline-block; margin: 0.7rem 0.7rem 0; font-size: 0.68rem; font-weight: 700; color: var(--seal); }
:deep(.cbody) { display: flex; flex-direction: column; }
:deep(.thumb) { height: 140px; background-size: cover; background-position: center; background-color: #d9dbe9; }
:deep(.ctxt) { padding: 0.85rem 0.9rem; }
:deep(.cti) { font-family: "Galmuri11", monospace; font-weight: 700; font-size: 1rem; color: var(--ink); line-height: 1.3; }
:deep(.cmeta) { margin-top: 0.4rem; font-size: 0.74rem; color: #5b607d; display: flex; gap: 0.3rem; align-items: center; flex-wrap: wrap; }
:deep(.cmeta .dot) { color: #b9bccf; }
:deep(.cmeta .cc) { color: var(--seal); }
:deep(.cmeta .vc) { margin-left: auto; }
.empty { text-align: center; color: #9a9fbb; padding: 3rem 0; }
.sentinel { height: 1px; }
.loading { text-align: center; color: #5b607d; padding: 1rem; font-size: 0.85rem; }
</style>
