<template>
  <div class="bg-[#ffffff] border border-[#d9dbe9] rounded-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <!-- HEADER -->

        <thead class="bg-[#f0f1f8] text-[#6b5f4b]">
          <tr>
            <th
              v-if="selectable"
              class="border border-[#d9dbe9] w-10 text-center"
            >
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleAll"
              />
            </th>

            <th
              v-for="col in columns"
              :key="col.key"
              class="border border-[#d9dbe9] px-3 py-2 font-semibold select-none"
              :class="[
                col.thClass,
                alignClass(col, 'center'),
                { 'cursor-pointer': sortable && col.sortable },
              ]"
              :style="{
                width: col.width,
                minWidth: col.minWidth,
              }"
              @click="changeSort(col)"
            >
              <div class="flex justify-center items-center gap-1">
                {{ col.label }}

                <span v-if="sortable && col.sortable">
                  <span v-if="sortKey === col.key">
                    {{ sortOrder === "asc" ? "▲" : "▼" }}
                  </span>

                  <span v-else class="text-[#9a9fbb]"> ⇅ </span>
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- BODY -->

        <tbody>
          <tr v-if="loading">
            <td
              :colspan="columns.length + (selectable ? 1 : 0)"
              class="text-center py-8"
            >
              Loading...
            </td>
          </tr>

          <tr v-else-if="!displayRows.length">
            <td
              :colspan="columns.length + (selectable ? 1 : 0)"
              class="text-center py-8 text-[#9a9fbb]"
            >
              데이터가 없습니다
            </td>
          </tr>

          <tr
            v-for="row in displayRows"
            :key="row[rowKey]"
            class="hover:bg-[#f0f1f8] transition-colors"
            @click="rowClick(row)"
          >
            <td
              v-if="selectable"
              class="border border-[#d9dbe9] text-center"
              @click.stop
            >
              <input
                type="checkbox"
                :checked="selectedRows.includes(row[rowKey])"
                @change="toggleRow(row[rowKey])"
              />
            </td>

            <td
              v-for="col in columns"
              :key="col.key"
              class="border border-[#d9dbe9] px-3 py-2 text-[color:var(--ink-soft)]"
              :class="[col.tdClass, alignClass(col)]"
              :style="{
                width: col.width,
                minWidth: col.minWidth,
              }"
              @click.stop="cellClick(row, col)"
            >
              <!-- 이미지 타입 -->
              <template v-if="col.type === 'img'">
                <img
                  v-if="row[col.key]"
                  :src="row[col.key]"
                  class="h-10 mx-auto object-contain"
                />
                <span v-else>-</span>
              </template>

              <template v-else-if="col.type === 'button'">
                <button
                  class="px-3 py-1.5 bg-[#7a5cff] text-white rounded-md text-sm hover:bg-[#5f3fe0]"
                >
                  {{ col.label }}
                </button>
              </template>
              <!-- 기본 slot -->
              <template v-else>
                <slot :name="col.key" :row="row" :value="row[col.key]">
                  {{ formatValue(row[col.key], col) }}
                </slot>
              </template>
            </td>
          </tr>
        </tbody>

        <!-- PAGINATION -->

        <tfoot v-if="pagination">
          <tr>
            <td
              :colspan="columns.length + (selectable ? 1 : 0)"
              class="border-t border-[#d9dbe9] px-4 py-3 bg-[#f0f1f8] text-[#6b5f4b]"
            >
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <!-- page size -->
                <div class="flex items-center gap-2 text-sm">
                  <span class="whitespace-nowrap">페이지당</span>
                  <select
                    v-model.number="localPageSize"
                    @change="changePageSize"
                    class="border border-[#b9bccf] rounded px-2 py-1 bg-[#ffffff]"
                  >
                    <option
                      v-for="size in pageSizeOptions"
                      :key="size"
                      :value="size"
                    >
                      {{ size }}
                    </option>
                  </select>
                </div>

                <!-- pagination -->
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="flex border border-[#b9bccf] rounded overflow-hidden text-sm">
                    <button
                      class="px-2 py-1 border-r border-[#d9dbe9] bg-[#ffffff] hover:bg-[#d9dbe9] disabled:opacity-40"
                      :disabled="page === 1"
                      @click="changePage(1)"
                    >
                      처음
                    </button>
                    <button
                      class="px-2 py-1 border-r border-[#d9dbe9] bg-[#ffffff] hover:bg-[#d9dbe9] disabled:opacity-40"
                      :disabled="page === 1"
                      @click="changePage(page - 1)"
                    >
                      이전
                    </button>
                    <button
                      class="px-2 py-1 border-r border-[#d9dbe9] bg-[#ffffff] hover:bg-[#d9dbe9] disabled:opacity-40"
                      :disabled="page >= totalPages"
                      @click="changePage(page + 1)"
                    >
                      다음
                    </button>
                    <button
                      class="px-2 py-1 bg-[#ffffff] hover:bg-[#d9dbe9] disabled:opacity-40"
                      :disabled="page >= totalPages"
                      @click="changePage(totalPages)"
                    >
                      마지막
                    </button>
                  </div>

                  <div class="flex items-center gap-1 text-sm">
                    <input
                      type="number"
                      v-model.number="inputPage"
                      class="w-14 text-center border border-[#b9bccf] rounded px-2 py-1 bg-[#ffffff]"
                      :min="1"
                      :max="totalPages"
                      @keyup.enter="applyPage"
                      @blur="applyPage"
                    />
                    <span class="text-[#5b607d] whitespace-nowrap">
                      / {{ totalPages }}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { formatDateTime } from "@/utils/date";

export default {
  name: "BaseTable",

  props: {
    columns: { type: Array, default: () => [] },

    rows: { type: Array, default: () => [] },

    sortable: { type: Boolean, default: true },

    selectable: { type: Boolean, default: false },

    pagination: { type: Boolean, default: false },

    pageSize: { type: Number, default: 10 },

    pageSizeOptions: {
      type: Array,
      default: () => [10, 20, 50, 100],
    },

    loading: { type: Boolean, default: false },

    rowKey: { type: String, default: "id" },
  },

  data() {
    return {
      selectedRows: [],

      sortKey: null,
      sortOrder: "asc",

      page: 1,
      inputPage: 1,

      localPageSize: this.pageSize,
    };
  },

  computed: {
    // 모든 행이 선택되었는지 여부를 반환한다
    isAllSelected() {
      return this.rows.length && this.selectedRows.length === this.rows.length;
    },

    // 일부만 선택된 상태(부분 선택)인지 반환한다
    isIndeterminate() {
      return (
        this.selectedRows.length &&
        this.selectedRows.length !== this.rows.length
      );
    },

    // sortKey/sortOrder에 따라 정렬된 행 목록을 반환한다
    sortedRows() {
      if (!this.sortKey) return this.rows;

      const sorted = [...this.rows].sort((a, b) => {
        let v1 = a[this.sortKey];
        let v2 = b[this.sortKey];

        if (typeof v1 === "number") {
          return this.sortOrder === "asc" ? v1 - v2 : v2 - v1;
        }

        return this.sortOrder === "asc"
          ? String(v1).localeCompare(String(v2))
          : String(v2).localeCompare(String(v1));
      });

      return sorted;
    },

    // 페이지네이션 기준 전체 페이지 수를 반환한다
    totalPages() {
      return Math.ceil(this.sortedRows.length / this.localPageSize);
    },

    // 현재 페이지에서 표시할 행 배열을 반환한다
    displayRows() {
      if (!this.pagination) return this.sortedRows;

      const start = (this.page - 1) * this.localPageSize;
      const end = start + this.localPageSize;

      return this.sortedRows.slice(start, end);
    },
  },

  watch: {
    // 페이지 변경 시 입력창 값과 동기화한다
    page(v) {
      this.inputPage = v;
    },
    // rows 변화로 페이지가 범위를 벗어나면 마지막 페이지(또는 1)로 보정
    "sortedRows.length"() {
      const max = Math.max(1, this.totalPages);
      if (this.page > max) {
        this.page = max;
      }
    },
  },

  methods: {
    // 선택한 로우 아이디 정보
    getSelectedIds() {
      return this.selectedRows;
    },
    // 선택된 데이터 정보
    getSelectedRows() {
      return this.rows.filter((row) =>
        this.selectedRows.includes(row[this.rowKey]),
      );
    },

    // align 별 Tailwind 클래스 반환 (기본값: 좌측 정렬)
    alignClass(col, fallback = "text-left") {
      if (col.align === "right") return "text-right";
      if (col.align === "center") return "text-center";
      if (col.align === "left") return "text-left";
      return fallback;
    },

    // 컬럼 타입별 값 포맷팅을 수행한다 (숫자/통화/날짜)
    formatValue(value, column) {
      if (value === null || value === undefined) return "-";
      if (column.formatter) return column.formatter(value);

      switch (column.type) {
        case "number":
          return Number(value || 0).toLocaleString();
        case "currency":
          return Number(value).toLocaleString() + "원";
        case "date":
        case "datetime":
          return formatDateTime(value);
        default:
          return value;
      }
    },

    // 헤더 체크박스로 전체 선택/해제를 토글한다
    toggleAll(e) {
      if (e.target.checked) {
        this.selectedRows = this.rows.map((r) => r[this.rowKey]);
      } else {
        this.selectedRows = [];
      }

      this.$emit("update:selected", this.selectedRows);
    },

    // 개별 행 선택 상태를 토글한다
    toggleRow(id) {
      if (this.selectedRows.includes(id)) {
        this.selectedRows = this.selectedRows.filter((i) => i !== id);
      } else {
        this.selectedRows.push(id);
      }

      this.$emit("update:selected", this.selectedRows);
    },

    // 컬럼 헤더 클릭으로 정렬 키/방향을 변경한다
    changeSort(col) {
      if (!this.sortable) return;
      if (!col.sortable) return;

      if (this.sortKey === col.key) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = col.key;
        this.sortOrder = "asc";
      }

      this.$emit("sort", {
        key: this.sortKey,
        order: this.sortOrder,
      });
    },

    // 현재 페이지를 변경하고 이벤트를 emit한다 (범위 보정 포함)
    changePage(p) {
      const max = Math.max(1, this.totalPages);
      this.page = Math.max(1, Math.min(p, max));
      this.$emit("update:page", this.page);
    },

    // 입력창 값으로 페이지 이동 (범위 보정 포함)
    applyPage() {
      if (this.inputPage < 1) this.inputPage = 1;

      if (this.inputPage > this.totalPages) this.inputPage = this.totalPages;

      this.changePage(this.inputPage);
    },

    // 페이지 사이즈 변경 및 첫 페이지로 리셋한다
    changePageSize() {
      this.page = 1;
      this.inputPage = 1;

      this.$emit("update:pageSize", this.localPageSize);
    },

    // 행 클릭 이벤트를 상위로 emit한다
    rowClick(row) {
      this.$emit("row-click", row);
    },

    // 셀 클릭 이벤트를 행/컬럼 정보와 함께 emit한다
    cellClick(row, col) {
      this.$emit("cell-click", {
        row,
        column: col,
        key: col.key,
        value: row[col.key],
      });
    },
  },
};
</script>
