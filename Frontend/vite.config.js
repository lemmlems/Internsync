const path = require("node:path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  publicDir: path.resolve(__dirname, "../Images"),
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.INTERNSYNC_API_URL || "http://127.0.0.1:3000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
