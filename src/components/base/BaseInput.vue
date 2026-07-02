<template>
  <div class="w-full">
    <!-- label -->
    <label v-if="label" class="block text-[11px] font-semibold text-[#7a6e5c] mb-1">
      {{ label }}
      <span v-if="required" class="text-[#b23a2e] ml-1">*</span>
    </label>

    <!-- input -->
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="updateValue"
      class="w-full h-[30px] rounded-md border px-2.5 text-xs bg-[#fffef9] text-[color:var(--ink)] transition focus:outline-none focus:ring-2 focus:ring-[#b23a2e]/15 focus:border-[#b23a2e] disabled:bg-[#f1ead9] disabled:cursor-not-allowed placeholder:text-[#c3b596]"
      :class="error ? 'border-[#b23a2e]' : 'border-[#cdbf9f]'"
    />

    <!-- error -->
    <p v-if="error" class="text-[11px] text-[#b23a2e] mt-1">
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
export default {
  name: "BaseInput",
  props: {
    modelValue: [String, Number],
    label: String,
    placeholder: String,
    error: String,
    type: {
      type: String,
      default: "text",
    },
    required: Boolean,
    disabled: Boolean,
  },
  emits: ["update:modelValue"],
  methods: {
    // input 변경 시 v-model 업데이트 이벤트를 emit한다
    updateValue(e: Event) {
      const target = e.target as HTMLInputElement;
      this.$emit("update:modelValue", target.value);
    },
  },
};
</script>
