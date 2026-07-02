<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[#1b1714]/45 backdrop-blur-[2px]"
      @click="onBackdropClick"
    >
      <div
        class="w-[380px] rounded-2xl bg-[#fffdf7] ring-1 ring-[#e6d9bd] shadow-[0_24px_60px_rgba(50,36,14,0.28)] overflow-hidden"
        @click.stop
      >
        <!-- 헤더 -->
        <div
          class="flex items-center gap-3 px-4 py-3 border-b border-[#efe6d2]"
          :class="theme.headerBg"
        >
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            :class="theme.iconWrap"
          >
            <i :class="['fa-solid', theme.icon, 'text-white']"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="text-[10px] font-bold uppercase tracking-widest"
              :class="theme.label"
            >
              {{ variantLabel }}
            </div>
            <div class="text-sm font-bold text-[color:var(--ink)] truncate">
              {{ title }}
            </div>
          </div>
        </div>

        <!-- 내용 -->
        <div class="px-4 py-4 text-[13px] text-[#4b4235] whitespace-pre-line">
          {{ message }}
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end gap-2 px-4 py-3 border-t border-[#efe6d2] bg-[#f7f0df]/70">
          <button
            v-if="type === 'confirm'"
            class="h-[32px] px-4 rounded-lg text-xs font-semibold text-[#6f6455] bg-[#f4ead6] border border-[#ddceb0] hover:bg-[#ece0c6]"
            @click="emit('cancel')"
          >
            취소
          </button>
          <button
            class="h-[32px] px-4 rounded-lg text-xs font-bold text-white shadow-sm"
            :class="theme.okBtn"
            @click="emit('ok')"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from "vue";

type Variant = "info" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    message?: string;
    type?: string;
    variant?: Variant;
  }>(),
  { variant: "info" },
);

const emit = defineEmits<{
  (e: "ok"): void;
  (e: "cancel"): void;
}>();

// variant 별 시각 메타데이터를 한 곳에서 관리
const VARIANT_THEMES: Record<Variant, {
  icon: string;
  iconWrap: string;
  headerBg: string;
  label: string;
  okBtn: string;
}> = {
  info: {
    icon: "fa-circle-info",
    iconWrap: "bg-[#a9852f] shadow-md shadow-[#a9852f]/30",
    headerBg: "bg-[#f7f0df]/70",
    label: "text-[#8a6c1f]",
    okBtn: "bg-[#9a7729] hover:bg-[#86671f]",
  },
  warning: {
    icon: "fa-triangle-exclamation",
    iconWrap: "bg-amber-500 shadow-md shadow-amber-500/30",
    headerBg: "bg-amber-50/60",
    label: "text-amber-600",
    okBtn: "bg-amber-600 hover:bg-amber-700",
  },
  danger: {
    icon: "fa-circle-exclamation",
    iconWrap: "bg-red-500 shadow-md shadow-red-500/30",
    headerBg: "bg-red-50/60",
    label: "text-red-600",
    okBtn: "bg-red-600 hover:bg-red-700",
  },
};

const theme = computed(() => VARIANT_THEMES[props.variant] || VARIANT_THEMES.info);

const variantLabel = computed(() => {
  if (props.variant === "danger") return "DANGER · 주의";
  if (props.variant === "warning") return "WARNING · 경고";
  return props.type === "confirm" ? "CONFIRM · 확인" : "INFO · 안내";
});

// 배경 클릭 시 confirm은 취소, alert는 확인으로 처리
function onBackdropClick() {
  if (props.type === "confirm") emit("cancel");
  else emit("ok");
}
</script>
