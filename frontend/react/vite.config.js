import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../server/public",
    emptyOutDir : true
  },
  esbuild: {
    minifyIdentifiers: false,
    keepNames: true,
  },
});
