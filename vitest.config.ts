import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // convex-test requires import.meta.glob which is a Vite API
    environment: "node",
    include: ["convex/__tests__/**/*.test.ts"],
    server: {
      deps: {
        // Ensure convex-test modules are processed by Vite
        inline: ["convex-test"],
      },
    },
  },
});
