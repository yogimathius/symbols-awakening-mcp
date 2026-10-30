import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "node:module";

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
      // This is a Node CLI: bundle local modules and leave installed packages
      // and Node built-ins to Node's resolver.
      external: (id) =>
        id.startsWith("node:") ||
        builtinModules.includes(id) ||
        (!id.startsWith(".") && !id.startsWith("/") && !id.startsWith("@/")),
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
