<template>
  <div class="w-full">
    <!-- label -->
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="text-[color:var(--danger)] ml-0.5">*</span>
    </label>

    <!-- input -->
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="updateValue"
      class="field"
      :class="error ? '!border-[color:var(--danger)]' : ''"
    />

    <!-- error -->
    <p v-if="error" class="text-[11px] text-[color:var(--danger)] mt-1 font-semibold">
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
