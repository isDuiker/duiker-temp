// 集中管理主题状态并同步到DOM属性
import { defineStore } from "pinia";

const THEME_KEY = "theme";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    currentTheme: localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light",
  }),
  actions: {
    initTheme() {
      this.applyTheme(this.currentTheme);
    },
    toggleTheme() {
      this.applyTheme(this.currentTheme === "light" ? "dark" : "light");
    },
    applyTheme(theme) {
      this.currentTheme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem(THEME_KEY, theme);
    },
  },
});
