<template>
  <div class="pdetail" v-if="post">
    <header class="phead">
      <router-link :to="`/board/${post.board?.slug}`" class="back"><i class="fa-solid fa-chevron-left"></i> {{ post.board?.name }}</router-link>
      <h1 class="ttl"><span v-if="post.is_notice" class="pin">공지</span>{{ post.title }}</h1>
      <div class="meta">
        <span class="au">{{ post.user?.name || post.user?.username || "-" }}</span>
        <span class="dot">·</span><span>{{ fmt(post.created_at) }}</span>
        <span class="dot">·</span><span>조회 {{ post.view_count }}</span>
        <div class="acts" v-if="canEdit">
          <router-link :to="`/post/${post.id}/edit`" class="mini">수정</router-link>
          <button class="mini danger" @click="removePost">삭제</button>
        </div>
      </div>
    </header>

    <article class="body prose" v-html="post.content"></article>

    <!-- 이미지 -->
    <div v-if="images.length" class="gallery">
      <a v-for="a in images" :key="a.id" :href="mediaUrl(a.path)" target="_blank" class="gitem">
        <img :src="mediaUrl(a.path)" :alt="a.filename" />
      </a>
    </div>
    <!-- 파일 -->
    <div v-if="files.length" class="files">
      <a v-for="a in files" :key="a.id" :href="mediaUrl(a.path)" target="_blank" class="file">
        <i class="fa-solid fa-paperclip"></i> {{ a.filename }} <span class="sz">{{ kb(a.size) }}</span>
      </a>
    </div>

    <!-- 댓글 -->
    <section v-if="post.board?.allow_comment" class="comments">
      <h2 class="ch">댓글 {{ post.comments.length }}</h2>
      <ul class="clist">
        <li v-for="c in post.comments" :key="c.id" class="citem">
          <div class="cinfo">
            <span class="cau">{{ c.user?.name || c.user?.username || "-" }}</span>
            <span class="ctime">{{ fmt(c.created_at) }}</span>
            <button v-if="canDeleteComment(c)" class="cdel" @click="removeComment(c.id)">삭제</button>
          </div>
          <p class="ctxt">{{ c.content }}</p>
        </li>
        <li v-if="!post.comments.length" class="cempty">첫 댓글을 남겨보세요.</li>
      </ul>
      <div class="cwrite">
        <textarea v-model="newComment" rows="2" placeholder="댓글을 입력하세요" @keydown.meta.enter="addComment"></textarea>
        <button class="csend" @click="addComment">등록</button>
      </div>
    </section>
  </div>
  <div v-else-if="error" class="err">{{ error }}</div>
  <div v-else class="loading">불러오는 중…</div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";
import { alertStore } from "@/plugins/alert.store";
import { boardApi, mediaUrl } from "@/api/board";
import { formatDateDotMinute as fmt } from "@/utils/date";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();
const post = ref(null);
const error = ref("");
const newComment = ref("");

const images = computed(() => (post.value?.attachments || []).filter((a) => a.is_image));
const files = computed(() => (post.value?.attachments || []).filter((a) => !a.is_image));
const canEdit = computed(() => post.value && auth.user && (post.value.user_id === auth.user.id || auth.user.is_super));
function canDeleteComment(c) { return auth.user && (c.user_id === auth.user.id || auth.user.is_super); }

function kb(n) { return n ? `${Math.round(n / 1024)}KB` : ""; }

async function load(id) {
  post.value = null; error.value = "";
  try { post.value = await boardApi.postGet(Number(id)); }
  catch (e) { error.value = e?.message || "게시글을 불러오지 못했습니다."; }
}
async function addComment() {
  if (!newComment.value.trim()) return;
  try {
    const c = await boardApi.commentAdd(post.value.id, newComment.value.trim());
    post.value.comments.push(c);
    newComment.value = "";
  } catch (e) { toast.error(e?.message || "댓글 등록 실패"); }
}
async function removeComment(id) {
  try { await boardApi.commentDelete(id); post.value.comments = post.value.comments.filter((c) => c.id !== id); }
  catch (e) { toast.error(e?.message || "삭제 실패"); }
}
async function removePost() {
  const ok = await alertStore.openConfirm("이 게시글을 삭제할까요?", "게시글 삭제", "danger");
  if (!ok) return;
  try {
    const slug = post.value.board?.slug;
    await boardApi.postDelete(post.value.id);
    toast.success("삭제되었습니다.");
    router.replace(slug ? `/board/${slug}` : "/board");
  } catch (e) { toast.error(e?.message || "삭제 실패"); }
}
onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => { if (id) load(id); });
</script>

<style scoped>
.pdetail { max-width: 780px; margin: 0 auto; }
.back { font-size: 0.78rem; color: #857a68; text-decoration: none; }
.back:hover { color: var(--seal); }
.ttl { font-family: "Noto Serif KR", serif; font-size: 1.5rem; font-weight: 700; color: var(--ink); margin-top: 0.4rem; }
.pin { font-size: 0.7rem; color: var(--seal); background: rgba(178, 58, 46, 0.1); padding: 0.1rem 0.45rem; border-radius: 999px; margin-right: 0.5rem; vertical-align: middle; }
.meta { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.6rem; font-size: 0.8rem; color: #948872; padding-bottom: 0.9rem; border-bottom: 1px solid #e6d9bd; }
.meta .au { font-weight: 700; color: #6b5f4b; }
.meta .dot { color: #cabb9f; }
.acts { margin-left: auto; display: flex; gap: 0.35rem; }
.mini { height: 28px; padding: 0 0.6rem; border-radius: 7px; font-size: 0.76rem; font-weight: 600; color: #6f6455; background: #f4ead6; border: 1px solid #ddceb0; text-decoration: none; display: inline-flex; align-items: center; }
.mini.danger { color: var(--seal); }
.body { padding: 1.4rem 0; font-size: 0.98rem; line-height: 1.75; color: #2a241d; min-height: 80px; }
.prose :deep(h2) { font-family: "Noto Serif KR", serif; font-size: 1.3rem; font-weight: 700; margin: 1rem 0 0.4rem; color: var(--ink); }
.prose :deep(p) { margin: 0.5rem 0; }
.prose :deep(blockquote) { border-left: 3px solid var(--seal); margin: 0.6rem 0; padding: 0.3rem 1rem; color: #6b5f4b; background: #f7f0df; border-radius: 0 8px 8px 0; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
.prose :deep(a) { color: var(--seal); text-decoration: underline; }
.prose :deep(img) { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }

.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.6rem; margin-bottom: 1rem; }
.gitem { display: block; border-radius: 10px; overflow: hidden; border: 1px solid #e6d9bd; }
.gitem img { width: 100%; height: 150px; object-fit: cover; display: block; }
.files { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.2rem; }
.file { font-size: 0.85rem; color: #6b5f4b; text-decoration: none; padding: 0.5rem 0.7rem; background: #fffdf7; border: 1px solid #e6d9bd; border-radius: 9px; }
.file:hover { background: #f7efdd; }
.file .sz { color: #a2957f; font-size: 0.75rem; margin-left: 0.3rem; }

.comments { margin-top: 1rem; border-top: 1px solid #e6d9bd; padding-top: 1.2rem; }
.ch { font-family: "Noto Serif KR", serif; font-weight: 700; color: var(--ink); margin-bottom: 0.9rem; }
.clist { display: flex; flex-direction: column; gap: 0.9rem; margin-bottom: 1.1rem; }
.citem { background: #fffdf7; border: 1px solid #ece1c8; border-radius: 10px; padding: 0.7rem 0.85rem; }
.cinfo { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; }
.cau { font-weight: 700; color: var(--ink); }
.ctime { color: #a2957f; }
.cdel { margin-left: auto; font-size: 0.72rem; color: var(--seal); }
.ctxt { margin-top: 0.35rem; font-size: 0.9rem; color: #2a241d; white-space: pre-wrap; }
.cempty { color: #a2957f; font-size: 0.85rem; }
.cwrite { display: flex; gap: 0.5rem; }
.cwrite textarea { flex: 1; padding: 0.6rem 0.7rem; font-size: 0.9rem; border: 1px solid #cdbf9f; border-radius: 10px; outline: none; resize: vertical; background: #fffef9; }
.cwrite textarea:focus { border-color: var(--seal); box-shadow: 0 0 0 3px rgba(178, 58, 46, 0.13); }
.csend { flex-shrink: 0; padding: 0 1.1rem; border-radius: 10px; font-weight: 700; color: #fdefe2; background: var(--seal); border: 1px solid #8e2a20; }
.err { color: var(--seal); text-align: center; padding: 2rem; }
.loading { color: #857a68; text-align: center; padding: 2rem; }
</style>
