<template>
  <button
    type="button"
    class="tgl"
    :class="[size, { on: modelValue, dis: disabled }]"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click.stop="onClick"
  >
    <span class="knob"></span>
  </button>
</template>

<script setup lang="ts">
// @ts-nocheck
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  size: { type: String, default: "md" }, // md | sm
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);
function onClick() { if (!props.disabled) emit("update:modelValue", !props.modelValue); }
</script>

<style scoped>
.tgl {
  flex-shrink: 0; display: inline-block; position: relative; padding: 0;
  border: 2px solid var(--line-hard); border-radius: 3px; background: var(--surface-2);
  box-shadow: 2px 2px 0 var(--line-hard);
  cursor: pointer; transition: background 0.18s, box-shadow 0.08s, transform 0.08s; vertical-align: middle;
}
.tgl:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); }
.tgl:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--line-hard); }
.tgl.md { width: 48px; height: 28px; }
.tgl.sm { width: 40px; height: 24px; }
.tgl.on { background: #2e7d43; }
.knob {
  position: absolute; top: 2px; left: 2px; border-radius: 2px;
  background: #fff; border: 1px solid var(--line-hard); transition: transform 0.18s;
}
.tgl.md .knob { width: 20px; height: 20px; }
.tgl.sm .knob { width: 16px; height: 16px; }
.tgl.md.on .knob { transform: translateX(20px); }
.tgl.sm.on .knob { transform: translateX(16px); }
.tgl.dis { opacity: 0.5; cursor: not-allowed; }
.tgl.dis:hover, .tgl.dis:active { transform: none; box-shadow: 2px 2px 0 var(--line-hard); }
</style>
