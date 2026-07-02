<template>
  <Transition name="modal">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      @click.self="close"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
      >
        <!-- 헤더 -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-gray-100"
        >
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-location-dot text-blue-500"></i>
            <h3 class="text-sm font-bold text-gray-800">우편번호 검색</h3>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            @click="close"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 검색 영역 (다음 위젯 embed) -->
        <div class="relative bg-white" :style="{ height: '480px' }">
          <div ref="embedRef" class="w-full h-full"></div>

          <!-- 로딩 오버레이 -->
          <div
            v-if="loading"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/90"
          >
            <i
              class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"
            ></i>
            <p class="text-xs text-gray-500">우편번호 검색 서비스를 불러오는 중</p>
          </div>

          <!-- 에러 -->
          <div
            v-if="error"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white text-center px-6"
          >
            <i
              class="fa-solid fa-triangle-exclamation text-2xl text-red-400 mb-2"
            ></i>
            <p class="text-xs text-gray-600">
              우편번호 서비스를 불러오지 못했습니다.<br />
              잠시 후 다시 시도해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
// @ts-nocheck
const POSTCODE_SRC =
  "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

// 스크립트를 한 번만 로드하고 캐시하는 프로미스
let loaderPromise = null;
function loadDaumPostcode() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.daum?.Postcode) return Promise.resolve(window.daum);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SRC;
    script.async = true;
    script.onload = () =>
      window.daum?.Postcode ? resolve(window.daum) : reject(new Error("no daum"));
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("script load failed"));
    };
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export default {
  name: "DaumPostcodeModal",

  props: {
    modelValue: { type: Boolean, default: false },
  },

  emits: ["update:modelValue", "select"],

  data() {
    return {
      loading: false,
      error: false,
    };
  },

  watch: {
    // 모달이 열릴 때 다음 우편번호 위젯을 embed 한다
    modelValue(open) {
      if (open) this.$nextTick(() => this.mountWidget());
    },
  },

  methods: {
    // 모달을 닫는다
    close() {
      this.$emit("update:modelValue", false);
    },

    // 위젯 스크립트를 로드한 뒤 embedRef 영역에 임베드한다
    async mountWidget() {
      this.error = false;
      this.loading = true;
      try {
        const daum = await loadDaumPostcode();
        if (!this.$refs.embedRef) return;
        this.$refs.embedRef.innerHTML = "";
        new daum.Postcode({
          width: "100%",
          height: "100%",
          oncomplete: this.handleComplete,
        }).embed(this.$refs.embedRef, { autoClose: false });
      } catch (e) {
        this.error = true;
      } finally {
        this.loading = false;
      }
    },

    // 주소 선택 완료 시 zipcode/address/detailAddress 로 변환해 부모로 전달한다
    handleComplete(data) {
      // 도로명 우선, 없으면 지번 사용
      const base =
        data.userSelectedType === "R"
          ? data.roadAddress || data.address
          : data.jibunAddress || data.address;

      // 참고 항목(동/건물명)은 기본주소에 괄호로 덧붙인다
      let address = base;
      let extras = [];
      if (data.bname && /[동|로|가]$/.test(data.bname)) extras.push(data.bname);
      if (data.buildingName && data.apartment === "Y")
        extras.push(data.buildingName);
      if (extras.length) address += ` (${extras.join(", ")})`;

      this.$emit("select", {
        zipcode: data.zonecode,
        address,
        detailAddress: data.buildingName && data.apartment !== "Y"
          ? data.buildingName
          : "",
      });
      this.close();
    },
  },
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
