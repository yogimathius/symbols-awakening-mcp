import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Build configuration for Node.js CLI
  build: {
    target: "node18",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, "src/index.ts"),
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "util",
        "events",
        "stream",
        "crypto",
        "os",
        "child_process",
        "worker_threads",
        // External dependencies that should not be bundled
        "pg",
        "@modelcontextprotocol/sdk",
        "zod",
      ],
      output: {
        format: "es",
        entryFileNames: "index.js",
        banner: "#!/usr/bin/env node",
      },
    },
  },

  // Development
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  // Ensure proper ESM handling
  esbuild: {
    target: "node18",
    format: "esm",
  },
});
