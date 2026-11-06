// 集中管理主题状态并同步到 DOM 属性
import { defineStore } from "pinia";

export const THEME_KEY = "theme";

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : null;
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    // 优先使用用户上次选择，否则跟随系统主题
    currentTheme: getSavedTheme() || getSystemTheme(),
  }),
  actions: {
    initTheme() {
      this.applyTheme(this.currentTheme, false);
    },
    toggleTheme() {
      this.applyTheme(this.currentTheme === "light" ? "dark" : "light");
    },
    applyTheme(theme, persist = true) {
      this.currentTheme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;

      // 只有用户主动切换时才持久化，未选择时仍可跟随系统变化
      if (persist) {
        localStorage.setItem(THEME_KEY, theme);
      }
    },
  },
});
