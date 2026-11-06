import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取当前模式对应的环境变量文件（.env、.env.production 等）
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue(),
      tailwindcss(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        "~": resolve(__dirname, "./"),
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      open: true,
      proxy: {
        // 开发环境将 /api 代理到后端服务，并去掉 /api 前缀
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
