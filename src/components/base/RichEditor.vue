<template>
  <div class="reditor">
    <div class="rtoolbar">
      <button type="button" @mousedown.prevent="cmd('bold')" title="굵게"><b>B</b></button>
      <button type="button" @mousedown.prevent="cmd('italic')" title="기울임"><i>I</i></button>
      <button type="button" @mousedown.prevent="cmd('underline')" title="밑줄"><u>U</u></button>
      <button type="button" @mousedown.prevent="cmd('strikeThrough')" title="취소선"><s>S</s></button>
      <span class="sep"></span>
      <button type="button" @mousedown.prevent="cmd('formatBlock', 'H2')" title="제목">제목</button>
      <button type="button" @mousedown.prevent="cmd('formatBlock', 'P')" title="본문">본문</button>
      <button type="button" @mousedown.prevent="cmd('insertUnorderedList')" title="글머리 목록">• 목록</button>
      <button type="button" @mousedown.prevent="cmd('insertOrderedList')" title="번호 목록">1. 목록</button>
      <button type="button" @mousedown.prevent="cmd('formatBlock', 'BLOCKQUOTE')" title="인용">❝ 인용</button>
      <span class="sep"></span>
      <button type="button" @mousedown.prevent="addLink" title="링크"><i class="fa-solid fa-link"></i></button>
      <button v-if="upload" type="button" @mousedown.prevent="pickImage" title="이미지"><i class="fa-solid fa-image"></i></button>
      <span v-if="uploading" class="uprog">업로드 중…</span>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onImage" />
    </div>
    <div
      ref="editable"
      class="rcontent"
      contenteditable="true"
      :data-ph="placeholder"
      @input="onInput"
      @blur="onInput"
    ></div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { boardApi, mediaUrl } from "@/api/board";

const props = defineProps({
  modelValue: { type: String, default: "" },
  upload: { type: Boolean, default: true },
  placeholder: { type: String, default: "내용을 입력하세요" },
});
const emit = defineEmits(["update:modelValue"]);
const toast = useToast();

const editable = ref(null);
const fileInput = ref(null);
const uploading = ref(false);
let focused = false;

onMounted(() => { if (editable.value) editable.value.innerHTML = props.modelValue || ""; });
watch(() => props.modelValue, (v) => {
  if (editable.value && !focused && v !== editable.value.innerHTML) editable.value.innerHTML = v || "";
});

function onInput() { emit("update:modelValue", editable.value?.innerHTML || ""); }
function cmd(command, val = null) {
  editable.value?.focus();
  document.execCommand(command, false, val);
  onInput();
}
function addLink() {
  const url = window.prompt("링크 주소(URL)");
  if (url) cmd("createLink", url);
}
function pickImage() { fileInput.value?.click(); }
async function onImage(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  uploading.value = true;
  try {
    const saved = await boardApi.upload(files);
    for (const a of saved) {
      cmd("insertHTML", `<img src="${mediaUrl(a.path)}" style="max-width:100%;border-radius:8px;margin:6px 0;" />`);
    }
  } catch (err) { toast.error(err?.message || "이미지 업로드 실패"); }
  finally { uploading.value = false; e.target.value = ""; }
}

// 포커스 추적 (외부 값 반영 시 커서 튐 방지)
onMounted(() => {
  const el = editable.value;
  if (!el) return;
  el.addEventListener("focus", () => (focused = true));
  el.addEventListener("blur", () => (focused = false));
});
</script>

<style scoped>
.reditor { border: 1px solid #cdbf9f; border-radius: 10px; overflow: hidden; background: #fffef9; }
.rtoolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 0.4rem 0.5rem; border-bottom: 1px solid #e6d9bd; background: #f7f0df; }
.rtoolbar button { min-width: 30px; height: 28px; padding: 0 0.5rem; border-radius: 6px; font-size: 0.8rem; color: #6b5f4b; background: transparent; transition: background 0.12s; }
.rtoolbar button:hover { background: #ece0c6; }
.sep { width: 1px; height: 18px; background: #ddceb0; margin: 0 4px; }
.uprog { font-size: 0.72rem; color: var(--seal); margin-left: 0.3rem; }
.rcontent {
  min-height: 240px; max-height: 60vh; overflow-y: auto;
  padding: 0.9rem 1rem; font-size: 0.95rem; line-height: 1.7; color: var(--ink); outline: none;
}
.rcontent:empty::before { content: attr(data-ph); color: #a99c84; }
.rcontent :deep(h2) { font-family: "Noto Serif KR", serif; font-size: 1.25rem; font-weight: 700; margin: 0.6rem 0 0.3rem; }
.rcontent :deep(blockquote) { border-left: 3px solid var(--seal); margin: 0.5rem 0; padding: 0.2rem 0.9rem; color: #6b5f4b; background: #f7f0df; border-radius: 0 8px 8px 0; }
.rcontent :deep(ul), .rcontent :deep(ol) { padding-left: 1.4rem; margin: 0.4rem 0; }
.rcontent :deep(a) { color: var(--seal); text-decoration: underline; }
.rcontent :deep(img) { max-width: 100%; border-radius: 8px; }
</style>
