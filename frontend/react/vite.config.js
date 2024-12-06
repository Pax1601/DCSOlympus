import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/vite",
  build: {
    outDir: '../server/public/vite'
  },esbuild: {
    minifyIdentifiers: false,
    keepNames: true,
  }
});
    