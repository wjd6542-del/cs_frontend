<template>
  <div class="relative w-full">
    <div class="flex h-[34px] border-2 border-[#b9bccf] rounded-[3px] overflow-hidden bg-white">
      <input
        :value="formattedDate"
        @click="toggleCalendar"
        readonly
        :placeholder="placeholder"
        class="flex-1 px-2.5 text-xs outline-none cursor-pointer"
      />

      <button
        v-if="innerValue"
        type="button"
        @click.stop="clearDate"
        class="px-2 h-[34px] border-l hover:bg-[#f0f1f8] text-red-500 text-xs"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

      <button
        type="button"
        @click.stop="toggleCalendar"
        class="px-2 h-[34px] border-l hover:bg-[#f0f1f8] text-[#5b607d] text-xs"
      >
        <i class="fa-regular fa-calendar"></i>
      </button>
    </div>

    <div
      v-show="openCalendar"
      class="absolute left-0 mt-2 z-50 bg-white border-2 border-[#1b1d2e] rounded-[3px] shadow-[4px_4px_0_#1b1d2e]"
    >
      <VCDatePicker color="purple"
        v-model="innerValue"
        :mode="mode"
        :is24hr="true"
        :time-picker="{ minutesIncrement: minuteStep }"
        @update:modelValue="handleSelect"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { DatePicker as VCDatePicker } from "v-calendar";

export default {
  name: "DatePicker",
  components: { VCDatePicker },

  props: {
    modelValue: {
      type: [String, Date, null] as any,
      default: null,
    },
    placeholder: {
      type: String,
      default: "날짜 선택",
    },
    mode: {
      type: String,
      default: "date",
    },
    minuteStep: {
      type: Number,
      default: 10,
    },
  },

  emits: ["update:modelValue", "change"],

  data() {
    return {
      openCalendar: false,
      innerValue: null as Date | null,
    };
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        if (!val) {
          this.innerValue = null;
          return;
        }
        this.innerValue = val instanceof Date ? val : new Date(val);
      },
    },
  },

  computed: {
    formattedDate(): string {
      if (!this.innerValue) return "";
      const d = this.innerValue;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      if (this.mode === "date") return `${yyyy}-${mm}-${dd}`;
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    },
  },

  mounted() {
    document.addEventListener("click", this.handleOutside, true);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.handleOutside, true);
  },

  methods: {
    toggleCalendar() {
      this.openCalendar = !this.openCalendar;
    },

    clearDate() {
      this.innerValue = null;
      this.$emit("update:modelValue", "");
      this.$emit("change", "");
      this.openCalendar = false;
    },

    formatToString(d: Date): string {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      if (this.mode === "date") return `${yyyy}-${mm}-${dd}`;
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    },

    handleSelect(val: Date | null) {
      if (!val) {
        this.innerValue = null;
        this.$emit("update:modelValue", "");
        this.$emit("change", "");
        return;
      }
      this.innerValue = val;
      const str = this.formatToString(val);
      this.$emit("update:modelValue", str);
      this.$emit("change", str);
      this.openCalendar = false;
    },

    handleOutside(event: any) {
      if (!this.$el.contains(event.target)) {
        this.openCalendar = false;
      }
    },
  },
};
</script>
