<template>
  <div class="drange">
    <input type="date" class="field !w-40" :value="from" @change="upd('from', $event.target.value)" />
    <span class="tilde">~</span>
    <input type="date" class="field !w-40" :value="to" @change="upd('to', $event.target.value)" />
    <div class="presets">
      <button v-for="p in presets" :key="p.key" class="btn btn-xs" @click="apply(p)">{{ p.label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
const props = defineProps({ from: { type: String, default: "" }, to: { type: String, default: "" } });
const emit = defineEmits(["update:from", "update:to", "change"]);

const presets = [
  { key: "today", label: "오늘" },
  { key: "month", label: "이번달" },
  { key: "q", label: "최근3개월" },
  { key: "all", label: "전체" },
];

function iso(dt) {
  // 로컬 기준 YYYY-MM-DD
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function upd(which, val) {
  emit(which === "from" ? "update:from" : "update:to", val);
  emit("change");
}

function apply(p) {
  const now = new Date();
  let from = "";
  let to = iso(now);
  if (p.key === "today") from = iso(now);
  else if (p.key === "month") from = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  else if (p.key === "q") from = iso(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()));
  else if (p.key === "all") { from = ""; to = ""; }
  emit("update:from", from);
  emit("update:to", to);
  emit("change");
}
</script>

<style scoped>
.drange { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.tilde { color: var(--ink-faint); }
.presets { display: flex; gap: 0.25rem; margin-left: 0.2rem; }
</style>
