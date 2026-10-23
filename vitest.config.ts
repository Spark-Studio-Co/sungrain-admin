import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "react-router-dom": fileURLToPath(
        new URL("./src/lib/router-compat.tsx", import.meta.url),
      ),
    },
  },
});
