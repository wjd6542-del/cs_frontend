// @ts-nocheck
import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => ({ dark: false }),
  actions: {
    apply() {
      document.documentElement.classList.toggle("dark", this.dark);
    },
    init() {
      const saved = localStorage.getItem("theme");
      if (saved) this.dark = saved === "dark";
      else this.dark = !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
      this.apply();
    },
    setDark(v: boolean) {
      this.dark = v;
      localStorage.setItem("theme", v ? "dark" : "light");
      this.apply();
    },
    toggle() {
      this.setDark(!this.dark);
    },
  },
});
