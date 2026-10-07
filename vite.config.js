import { defineConfig } from "vite";
import importOptionalTheme from "./rollup-plugin-import-optional-themes.js";
import { resolve } from "node:path";

export default defineConfig({
  // Configure base if needed for Github Pages, e.g. './' ensures relative paths work anywhere
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        theme_select: resolve(import.meta.dirname, "src/theme_select.html"),
      },
    },
  },
  server: {
    port: 8080,
  },
  plugins: [importOptionalTheme()],
});
