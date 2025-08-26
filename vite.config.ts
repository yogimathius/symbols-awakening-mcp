import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Build configuration for Node.js CLI
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "symbols-awakening-mcp",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "child_process",
        "crypto",
        "os",
        "util",
        "stream",
        "events",
        "buffer",
        "querystring",
        "net",
        "tls",
        "http",
        "https",
        "zlib",
        "process",
        "tty",
        "readline",
        // Node.js module pattern
        "node:process",
        "node:tty",
        "node:readline",
        // Prisma client - keep it external to avoid bundling issues
        "@prisma/client",
        ".prisma/client",
        ".prisma/client/index-browser",
      ],
      output: {
        banner: "#!/usr/bin/env node",
      },
    },
    target: "node18",
    minify: false,
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
