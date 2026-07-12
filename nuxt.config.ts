// https://nuxt.com/docs/api/configuration/nuxt-config

import process from "node:process";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from "nuxt/config";

/**
 * Repo root — the `@/` alias resolves from `src/` (e.g. `@/app/lib/...`).
 */
const rootDir: string = fileURLToPath(new URL(".", import.meta.url));

const config: ReturnType<typeof defineNuxtConfig> = defineNuxtConfig({
  alias: {
    "@": `${rootDir}src`,
  },
  app: {
    head: {
      link: [
        { href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
        { href: "https://fonts.googleapis.com", rel: "preconnect" },
        {
          crossorigin: "",
          href: "https://fonts.gstatic.com",
          rel: "preconnect",
        },
        {
          href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap",
          rel: "stylesheet",
        },
      ],
      meta: [{ content: "#0B0D12", name: "theme-color" }],
    },
  },
  compatibilityDate: "2025-07-15",
  components: [
    {
      extensions: ["vue"],
      path: `${rootDir}src/app/components/ui`,
      pathPrefix: false,
    },
    { ignore: ["**/ui/**"], path: `${rootDir}src/app/components` },
  ],

  css: ["@/app/assets/css/main.css"],
  devtools: { enabled: true },

  dir: {
    public: "src/public",
  },
  i18n: {
    defaultLocale: "fr",
    locales: [
      { code: "fr", file: "fr.json" },
      { code: "en", file: "en.json" },
    ],
    restructureDir: "src/i18n",
    strategy: "no_prefix",
  },
  imports: {
    imports: [{ from: "@/app/lib/cn.ts", name: "cn" }],
  },

  modules: ["@vueuse/nuxt", "nuxt-auth-utils", "@nuxtjs/i18n"],

  nitro: {
    alias: {
      "@": `${rootDir}src`,
    },
    typescript: {
      tsConfig: {
        compilerOptions: {
          allowImportingTsExtensions: true,
        },
      },
    },
  },
  runtimeConfig: {
    authLookupPepper: process.env.AUTH_LOOKUP_PEPPER,
    authRateLimitDuration: process.env.AUTH_RATE_LIMIT_DURATION,
    authRateLimitPoints: process.env.AUTH_RATE_LIMIT_POINTS,
    databaseHost: process.env.DATABASE_HOST,
    databaseName: process.env.DATABASE_NAME,
    databasePassword: process.env.DATABASE_PASSWORD,
    databasePort: process.env.DATABASE_PORT,
    databaseUser: process.env.DATABASE_USER,
    rateLimitDuration: process.env.RATE_LIMIT_DURATION,
    rateLimitPoints: process.env.RATE_LIMIT_POINTS,
    redisUrl: process.env.REDIS_URL,
    trustedProxy: process.env.TRUSTED_PROXY,
  },
  serverDir: "src/server",
  srcDir: "src/app",
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
      },
    },
    typeCheck: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

export default config;
