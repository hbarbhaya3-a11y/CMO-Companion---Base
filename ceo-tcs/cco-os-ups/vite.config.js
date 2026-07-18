import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// base: './' + singlefile => the built dist/index.html is fully self-contained
// and opens by double-click (file://) with no server and no internet.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: { outDir: "dist", assetsInlineLimit: 100000000, cssCodeSplit: false },
});
