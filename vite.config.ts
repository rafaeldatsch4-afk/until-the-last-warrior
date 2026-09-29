import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon-192-any.png", "icon-512-any.png"],
      manifest: false, // já temos public/manifest.json próprio, não deixe o plugin gerar outro
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,webp,jpg,jpeg,svg,mp3,ogg,wav}"],
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
    // Phaser alone minifies to ~1.2 MB; vendors get their own chunks so a game
    // update doesn't make players re-download (or the PWA re-cache) the engine.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/phaser/")) return "phaser";
          if (id.includes("/firebase/") || id.includes("/@firebase/")) return "firebase";
          if (id.includes("socket.io") || id.includes("engine.io")) return "socketio";
          if (id.includes("/react") || id.includes("/scheduler/") || id.includes("/motion") || id.includes("/framer-motion/")) return "react";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
