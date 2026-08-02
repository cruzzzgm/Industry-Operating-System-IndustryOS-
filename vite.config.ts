import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // Base atualizada para o GitHub Pages encontrar os arquivos
  base: "/Industry-Operating-System-IndustryOS-/",
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: true,
    },
  },
  // Plugin do lovable removido, deixando só o react
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));