import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// The engine (merge, diff, resolve) lives in ../src and is shared with the Node tests.
const engine = fileURLToPath(new URL("../src", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@engine": engine } },
  server: { fs: { allow: [".."] } },
});
