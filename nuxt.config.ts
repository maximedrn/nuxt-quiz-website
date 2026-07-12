// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

/** Repo root — the `@/` alias resolves from here (e.g. `@/server/lib/...`). */
const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@vueuse/nuxt', 'nuxt-auth-utils'],

  // Every explicit import in the project is written `@/...` from the repo root.
  // Nuxt propagates this alias into both Vite and the generated tsconfig paths.
  alias: {
    '@': rootDir,
  },

  nitro: {
    alias: {
      '@': rootDir,
    },
    // viem (blockchain storage backend) pulls @noble/hashes, whose conditional
    // `./crypto` export gets mangled by Nitro's production trace. Keep them
    // external so Node resolves them from node_modules with exports intact.
    externals: {
      external: ['viem', '@noble/hashes', '@noble/curves'],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // Server-only. Populated from env vars at runtime and validated by the
    // `env` service (`@/server/lib/env/env.factory`).
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    storageDriver: process.env.STORAGE_DRIVER,
    authLookupPepper: process.env.AUTH_LOOKUP_PEPPER,
    rateLimitPoints: process.env.RATE_LIMIT_POINTS,
    rateLimitDuration: process.env.RATE_LIMIT_DURATION,
    authRateLimitPoints: process.env.AUTH_RATE_LIMIT_POINTS,
    authRateLimitDuration: process.env.AUTH_RATE_LIMIT_DURATION,
    trustedProxy: process.env.TRUSTED_PROXY,
    rpcUrl: process.env.RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
  },

  app: {
    head: {
      title: 'Core Solidity & EVM — Entraînement',
      meta: [
        {
          name: 'description',
          content:
            "Quiz d'entraînement pour la certification Cyfrin SSCD+ : 90 questions sur Solidity et l'EVM, avec suivi de progression.",
        },
        { name: 'theme-color', content: '#0B0D12' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  css: ['@/app/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
