<template>
  <div
    ref="wrapper"
    class="relative w-full"
    :style="{ zIndex: open ? 9999 : 1 }"
  >
    <!-- 트리거 -->
    <div :class="triggerClasses" @click="toggle">
      <div class="flex-1 truncate leading-none">
        {{ selectedLabel || placeholder }}
      </div>

      <div class="flex items-center gap-1 ml-1.5 h-full">
        <button
          v-if="modelValue !== null && modelValue !== ''"
          @click.stop="clear"
          class="text-[#9a9fbb] hover:text-[#7a5cff] transition-colors flex items-center justify-center text-[10px]"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

        <i
          class="fa-solid fa-chevron-down transition-transform duration-200 flex items-center justify-center"
          :class="[
            open ? 'rotate-180 text-[#7a5cff]' : 'text-[#9a9fbb]',
            isLargeSize ? 'text-xl' : 'text-[9px]',
          ]"
        ></i>
      </div>
    </div>

    <!-- 드롭다운: body 로 Teleport 하여 부모 overflow 클립 영향 없이 표시 -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdown"
        :style="dropdownStyle"
        class="bg-[#ffffff] border-2 border-[#1b1d2e] rounded-[3px] shadow-[4px_4px_0_#1b1d2e] overflow-hidden"
      >
        <div class="p-2 bg-[#f0f1f8] border-b-2 border-[#1b1d2e]">
          <input
            ref="searchInput"
            v-model="keyword"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full h-[30px] px-2 text-xs border-2 border-[#b9bccf] rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#7a5cff]/25 focus:border-[#7a5cff] bg-[#ffffff]"
          />
        </div>

        <div class="max-h-56 overflow-y-auto">
          <div
            v-for="item in filteredOptions"
            :key="item[valueKey]"
            class="px-3 py-1.5 text-xs hover:bg-[#f0f1f8] cursor-pointer flex justify-between items-center group transition-colors"
            @click="select(item)"
          >
            <span class="text-[#2c2f45] group-hover:text-[#7a5cff] font-medium">
              {{ item[labelKey] }}
            </span>
            <i
              v-if="item[valueKey] === modelValue"
              class="fa-solid fa-check text-[#7a5cff] text-[10px]"
            ></i>
          </div>
          <div
            v-if="filteredOptions.length === 0"
            class="px-3 py-5 text-[#9a9fbb] text-center text-xs"
          >
            {{ emptyText }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
export default {
  name: "SearchSelect",
  inheritAttrs: false,
  props: {
    modelValue: [String, Number, null],
    options: { type: Array, required: true },
    labelKey: { type: String, default: "label" },
    valueKey: { type: String, default: "value" },
    placeholder: { type: String, default: "선택하세요" },
    searchPlaceholder: { type: String, default: "검색..." },
    emptyText: { type: String, default: "검색 결과가 없습니다" },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      open: false,
      keyword: "",
      // Teleport 된 드롭다운의 fixed 위치 (트리거 rect 기반)
      dropdownStyle: {
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "0px",
        zIndex: 10000,
      },
    };
  },
  computed: {
    // 현재 선택된 옵션의 라벨을 반환한다
    selectedLabel() {
      const found = this.options.find(
        (o) => o[this.valueKey] === this.modelValue,
      );
      return found ? found[this.labelKey] : "";
    },
    // 키워드로 필터링된 옵션 목록을 반환한다
    filteredOptions() {
      if (!this.keyword) return this.options;
      return this.options.filter((o) =>
        String(o[this.labelKey])
          .toLowerCase()
          .includes(this.keyword.toLowerCase()),
      );
    },
    // 주입된 클래스에 큰 텍스트 크기가 포함됐는지 여부
    isLargeSize() {
      return /text-(xl|2xl|3xl|4xl)/.test(this.$attrs.class || "");
    },
    // 주입된 클래스 유무에 따라 트리거 버튼 클래스를 조립한다
    triggerClasses() {
      const parentClass = this.$attrs.class || "";

      const hasPadding = /p[xy]?-/.test(parentClass);
      const hasHeight = /h-/.test(parentClass);
      const hasBorder = /border/.test(parentClass);
      const hasRounded = /rounded/.test(parentClass);

      const hasText = /text-/.test(parentClass);

      return [
        "flex justify-between items-center cursor-pointer transition-all box-border relative text-[color:var(--ink)]",
        // 기본값 세팅 (주입된 클래스가 없을 때만)
        !hasHeight && !hasPadding && "h-[34px] px-2.5",
        !hasPadding && hasHeight && "px-2.5",
        !hasBorder && "border-2 border-[#b9bccf]",
        !hasRounded && "rounded-[3px]",
        !hasText && "text-xs",
        !hasPadding && !hasHeight && "bg-white",
        // 부모 주입 클래스
        parentClass,
        // 상태값
        this.open
          ? "ring-2 ring-[#7a5cff]/25 border-[#7a5cff]"
          : "hover:border-[#7a5cff]",
      ];
    },
  },
  methods: {
    // 트리거 위치를 기반으로 Teleport 드롭다운 좌표를 갱신한다
    updateDropdownPosition() {
      const el = this.$refs.wrapper;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dd = this.$refs.dropdown;
      const ddHeight = dd ? dd.offsetHeight : 240; // 추정값
      // 화면 하단 공간 부족 시 위로 띄움
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < ddHeight + 12 && rect.top > ddHeight + 12;
      const top = openUp ? rect.top - ddHeight - 4 : rect.bottom + 4;
      this.dropdownStyle = {
        position: "fixed",
        top: `${Math.round(top)}px`,
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        zIndex: 10000,
      };
    },

    // 드롭다운 열림 상태를 토글하고 검색창 포커스를 처리한다
    toggle() {
      this.open = !this.open;
      this.keyword = "";
      if (this.open) {
        this.$nextTick(() => {
          this.updateDropdownPosition();
          // 첫 paint 후 한 번 더 보정 (실제 dropdown height 반영)
          this.$nextTick(() => this.updateDropdownPosition());
          if (this.$refs.searchInput) this.$refs.searchInput.focus();
        });
      }
    },
    // 옵션 선택 시 v-model을 업데이트하고 드롭다운을 닫는다
    select(item) {
      this.$emit("update:modelValue", item[this.valueKey]);
      this.$emit("change", item[this.valueKey]);
      this.open = false;
    },
    // 선택을 해제한다
    clear() {
      this.$emit("update:modelValue", "");
      this.$emit("change", "");
      this.open = false;
    },
    // 컴포넌트 외부 클릭 시 드롭다운을 닫는다 (Teleport 된 dropdown 도 wrapper 외부로 보지 않도록 분기)
    handleClickOutside(e) {
      const w = this.$refs.wrapper;
      const dd = this.$refs.dropdown;
      if (!w) return;
      if (w.contains(e.target)) return;
      if (dd && dd.contains(e.target)) return;
      this.open = false;
    },
    // 스크롤·리사이즈 시 드롭다운이 트리거에서 떨어지지 않도록 동기화
    handleViewportChange() {
      if (this.open) this.updateDropdownPosition();
    },
  },
  // 마운트 시 외부 클릭/스크롤/리사이즈 리스너 등록
  mounted() {
    document.addEventListener("click", this.handleClickOutside, true);
    window.addEventListener("scroll", this.handleViewportChange, true);
    window.addEventListener("resize", this.handleViewportChange);
  },
  // 언마운트 직전 리스너들을 제거한다
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    window.removeEventListener("resize", this.handleViewportChange);
  },
};
</script>
