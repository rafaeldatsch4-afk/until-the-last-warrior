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
        // Optional screens are cached when visited, not downloaded at first install.
        globIgnores: ["assets/optional-*.js"],
        runtimeCaching: [{
          urlPattern: /\/assets\/optional-.*\.js$/,
          handler: "CacheFirst",
          options: { cacheName: "optional-game-screens-v1", expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
        }],
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
    manifest: true,
    rollupOptions: {
      output: {
        chunkFileNames: chunk => `assets/${chunk.isDynamicEntry ? 'optional-' : ''}[name]-[hash].js`,
        manualChunks(id) {
          if (id.includes('/node_modules/phaser/')) return 'phaser';
        },
      },
    },
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
