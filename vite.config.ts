import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192-any.png", "icon-512-any.png"],
      manifest: false, // já temos public/manifest.json próprio, não deixe o plugin gerar outro
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,mp3,ogg,wav}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
