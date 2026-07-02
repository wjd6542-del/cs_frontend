<template>
  <span v-if="tags && tags.length" class="tagchips">
    <span v-for="t in tags" :key="t.id" class="tchip" :style="{ background: t.color || '#7a5cff' }">{{ t.name }}</span>
  </span>
</template>

<script setup lang="ts">
// @ts-nocheck
defineProps({ tags: { type: Array, default: () => [] } });
</script>

<style scoped>
.tagchips { display: inline-flex; flex-wrap: wrap; gap: 0.2rem; vertical-align: middle; }
.tchip { font-family: var(--font-pixel); font-size: 0.6rem; color: #fff; border: 1px solid var(--line-hard); border-radius: 3px; padding: 0.05rem 0.35rem; white-space: nowrap; }
</style>
