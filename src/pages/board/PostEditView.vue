<template>
  <div class="pedit">
    <header class="phead">
      <p class="eyebrow">{{ board?.name }}</p>
      <h1 class="ttl">{{ isNew ? "글쓰기" : "글 수정" }}</h1>
    </header>

    <form class="card" @submit.prevent="submit">
      <input v-model="form.title" class="title" placeholder="제목" />
      <RichEditor v-model="form.content" :upload="!!board?.allow_upload" placeholder="내용을 입력하세요" />

      <div v-if="board?.allow_upload" class="uploads">
        <label class="ubtn">
          <i class="fa-solid fa-paperclip"></i> 이미지·파일 첨부
          <input type="file" multiple hidden @change="onFiles" />
        </label>
        <span v-if="uploading" class="uprog">업로드 중…</span>
        <div v-if="form.attachments.length" class="ulist">
          <div v-for="(a, i) in form.attachments" :key="i" class="uitem">
            <img v-if="a.is_image" :src="mediaUrl(a.path)" class="uthumb" />
            <i v-else class="fa-solid fa-file"></i>
            <span class="uname">{{ a.filename }}</span>
            <button type="button" class="urm" @click="form.attachments.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      </div>

      <label v-if="auth.user?.is_super" class="notice-toggle">
        <input type="checkbox" v-model="form.is_notice" /> 공지로 고정 (관리자)
      </label>

      <p v-if="msg" class="msg err">{{ msg }}</p>
      <div class="acts">
        <button type="submit" class="save" :disabled="saving">{{ saving ? "저장 중…" : "등록" }}</button>
        <router-link :to="`/board/${slug}`" class="cancel">취소</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";
import { boardApi, mediaUrl } from "@/api/board";
import RichEditor from "@/components/base/RichEditor.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();

const slug = computed(() => route.params.slug);
const editId = computed(() => route.params.id);
const isNew = computed(() => !route.params.id);
const board = ref(null);
const saving = ref(false);
const uploading = ref(false);
const msg = ref("");
const form = reactive({ title: "", content: "", is_notice: false, attachments: [] });

async function loadBoard() {
  if (isNew.value) {
    board.value = await boardApi.get(slug.value);
  } else {
    const p = await boardApi.postGet(Number(editId.value));
    board.value = p.board;
    form.title = p.title;
    form.content = p.content;
    form.is_notice = p.is_notice;
    // 기존 첨부는 유지 표시만(추가 업로드는 신규로 붙음)
  }
}
async function onFiles(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  uploading.value = true;
  try {
    const saved = await boardApi.upload(files);
    form.attachments.push(...saved);
  } catch (err) { toast.error(err?.message || "업로드 실패"); }
  finally { uploading.value = false; e.target.value = ""; }
}
async function submit() {
  msg.value = "";
  if (!form.title.trim()) { msg.value = "제목을 입력하세요."; return; }
  saving.value = true;
  try {
    const body = { board_id: board.value.id, title: form.title, content: form.content, is_notice: form.is_notice, attachments: form.attachments };
    if (!isNew.value) body.id = Number(editId.value);
    const saved = await boardApi.postSave(body);
    toast.success("등록되었습니다.");
    router.replace(`/post/${saved.id}`);
  } catch (e) { msg.value = e?.message || "저장 실패"; }
  finally { saving.value = false; }
}
onMounted(loadBoard);
</script>

<style scoped>
.pedit { max-width: 780px; margin: 0 auto; }
.phead { margin-bottom: 1rem; }
.eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; color: var(--seal); }
.ttl { font-family: "Galmuri11", monospace; font-size: 1.5rem; font-weight: 700; color: var(--ink); margin-top: 0.2rem; }
.card { background: #ffffff; border: 1px solid #d9dbe9; border-radius: 16px; padding: 1.3rem; display: flex; flex-direction: column; gap: 1rem; }
.title { height: 46px; padding: 0 0.9rem; font-size: 1.05rem; font-weight: 700; color: var(--ink); border: 1px solid #b9bccf; border-radius: 10px; outline: none; background: #ffffff; }
.title:focus { border-color: var(--seal); box-shadow: 0 0 0 3px rgba(122,92,255, 0.13); }
.content { padding: 0.8rem 0.9rem; font-size: 0.95rem; line-height: 1.7; color: var(--ink); border: 1px solid #b9bccf; border-radius: 10px; outline: none; resize: vertical; background: #ffffff; }
.content:focus { border-color: var(--seal); box-shadow: 0 0 0 3px rgba(122,92,255, 0.13); }

.uploads { border-top: 1px dashed #d9dbe9; padding-top: 1rem; }
.ubtn { display: inline-flex; align-items: center; gap: 0.4rem; height: 36px; padding: 0 0.9rem; border-radius: 9px; font-size: 0.84rem; font-weight: 600; color: #5b607d; background: #f0f1f8; border: 1px solid #b9bccf; cursor: pointer; }
.ubtn:hover { background: #e7e8f1; }
.uprog { margin-left: 0.6rem; font-size: 0.8rem; color: var(--seal); }
.ulist { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.8rem; }
.uitem { display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.5rem; background: #fff; border: 1px solid #d9dbe9; border-radius: 9px; font-size: 0.78rem; color: #5b607d; }
.uthumb { width: 34px; height: 34px; object-fit: cover; border-radius: 6px; }
.uname { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.urm { color: #b58a80; }
.urm:hover { color: var(--seal); }

.notice-toggle { display: flex; align-items: center; gap: 0.5rem; font-size: 0.86rem; color: #5b607d; }
.notice-toggle input { accent-color: #7a5cff; }
.msg.err { color: var(--seal); font-size: 0.85rem; font-weight: 600; }
.acts { display: flex; gap: 0.6rem; }
.save { height: 44px; padding: 0 1.4rem; border-radius: 10px; font-weight: 700; color: #ffffff; background: var(--seal-grad); border: 1px solid #5f3fe0; }
.save:hover { filter: brightness(1.05); }
.save:disabled { opacity: 0.6; }
.cancel { height: 44px; padding: 0 1.2rem; border-radius: 10px; display: inline-flex; align-items: center; font-weight: 600; color: #5b607d; background: #f0f1f8; border: 1px solid #b9bccf; text-decoration: none; }
</style>
