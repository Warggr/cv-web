import { defineConfig } from "vite";

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
});
