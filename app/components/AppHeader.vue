<script setup lang="ts">
import { History, LogOut, Moon, Plus, Sun } from 'lucide-vue-next'
import { TranslationKey } from '@/app/lib/i18n/i18n.keys'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { t, toggleLocale } = useI18n()
const { toggle: toggleTheme, isDark } = useTheme()
const { isAuthed, logout } = useAuth()
</script>

<template>
  <header class="border-b border-border bg-bg">
    <div class="container flex items-center justify-between py-4">
      <NuxtLink to="/" class="flex items-center gap-2 text-ink no-underline">
        <span class="block h-2.5 w-2.5 flex-none rounded-sm bg-accent" aria-hidden="true" />
        <span class="font-display text-base font-semibold tracking-tight">
          {{ t(TranslationKey.NavBrand) }}
        </span>
      </NuxtLink>

      <nav class="flex items-center gap-4">
        <button
          type="button"
          class="flex text-ink-muted transition-colors hover:text-ink"
          :aria-label="t(TranslationKey.ThemeToggle)"
          @click="toggleTheme"
        >
          <Moon v-if="isDark" :size="18" />
          <Sun v-else :size="18" />
        </button>
        <button
          type="button"
          class="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
          @click="toggleLocale"
        >
          {{ t(TranslationKey.LangToggle) }}
        </button>

        <template v-if="!compact">
          <NuxtLink
            to="/history"
            class="flex items-center gap-1.5 text-sm text-ink-muted no-underline transition-colors hover:text-ink"
          >
            <History :size="16" />
            {{ t(TranslationKey.NavHistory) }}
          </NuxtLink>
          <NuxtLink to="/quiz/new" class="btn btn-accent px-3.5 py-2 text-sm">
            <Plus :size="16" />
            {{ t(TranslationKey.NavNewSession) }}
          </NuxtLink>
          <button
            v-if="isAuthed"
            type="button"
            class="flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
            @click="logout"
          >
            <LogOut :size="16" />
            {{ t(TranslationKey.NavLogout) }}
          </button>
        </template>
      </nav>
    </div>
  </header>
</template>
