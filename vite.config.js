import { defineConfig } from "vite";
import importOptionalTheme from "./rollup-plugin-import-optional-themes.js";

export default defineConfig({
  // Configure base if needed for Github Pages, e.g. './' ensures relative paths work anywhere
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
  },
  plugins: [importOptionalTheme()],
});
