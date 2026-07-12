import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type ViteUserConfig } from "vitest/config";

/**
 * Repo root — mirrors the `@/` alias configured in `nuxt.config.ts`.
 */
const rootDir: string = fileURLToPath(new URL(".", import.meta.url));

const config: ViteUserConfig = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": `${rootDir}src`,
    },
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/.nuxt/**", "**/.output/**"],
    include: ["**/*.test.ts"],
  },
});

export default config;
