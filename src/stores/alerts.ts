// @ts-nocheck
import { defineStore } from "pinia";
import { supportApi } from "@/api/cs";

// 미해결(접수/처리중) 응대 알림 스토어
export const useAlertsStore = defineStore("alerts", {
  state: () => ({
    rows: [],
    total: 0,
    counts: { VENDOR: 0, GAME_COMPANY: 0 },
    loaded: false,
    _timer: null,
  }),
  actions: {
    async fetch() {
      try {
        const r = await supportApi.alerts({ limit: 20 });
        this.rows = r.rows || [];
        this.total = r.total || 0;
        this.counts = r.counts || { VENDOR: 0, GAME_COMPANY: 0 };
        this.loaded = true;
      } catch (e) {
        /* 미로그인/오류 시 조용히 무시 */
      }
    },
    // 주기적 자동 갱신 시작 (기본 30초)
    startPolling(ms = 30000) {
      this.stopPolling();
      this.fetch();
      this._timer = setInterval(() => this.fetch(), ms);
    },
    stopPolling() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },
  },
});
