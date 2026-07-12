<script setup lang="ts">
import { History, LogOut, Moon, Plus, Sun } from "lucide-vue-next";
import { type AuthApi, useAuth } from "@/app/composables/useAuth.ts";
import { type Theme, useTheme } from "@/app/composables/useTheme.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";

interface AppHeaderProps {
  compact?: boolean;
}

const _props: Readonly<Omit<AppHeaderProps, "compact">> & {
  readonly compact: boolean;
} = withDefaults(defineProps<AppHeaderProps>(), { compact: false });

const i18n: TypedI18n = useTypedI18n();
const theme: Theme = useTheme();
const auth: AuthApi = useAuth();
</script>

<template>
  <header :class="cn('border-b', 'border-border', 'bg-background')">
    <div
      :class="
        cn(
          'mx-auto',
          'w-full',
          'max-w-195',
          'px-6',
          'flex',
          'items-center',
          'justify-between',
          'py-4',
        )
      "
    >
      <NuxtLink
        to="/"
        :class="
          cn(
            'group',
            'flex',
            'items-center',
            'gap-2',
            'text-ink',
            'no-underline',
          )
        "
      >
        <span
          :class="
            cn(
              'block',
              'h-2.5',
              'w-2.5',
              'flex-none',
              'rounded-sm',
              'bg-accent',
              'transition-transform',
              'group-hover:scale-125',
            )
          "
          aria-hidden="true"
        />
        <span
          :class="
            cn(
              'font-display',
              'text-base',
              'font-semibold',
              'tracking-tight',
              'transition-colors',
              'group-hover:text-accent',
            )
          "
        >
          {{ i18n.t(TranslationKey.navBrand) }}
        </span>
      </NuxtLink>

      <nav :class="cn('flex', 'items-center', 'gap-4')">
        <button
          type="button"
          :class="
            cn(
              'group',
              'flex',
              'cursor-pointer',
              'text-ink-muted',
              'transition-colors',
              'hover:text-ink',
            )
          "
          :aria-label="i18n.t(TranslationKey.themeToggle)"
          @click="theme.toggle()"
        >
          <Moon
            v-if="theme.isDark"
            :size="18"
            :class="cn('transition-transform', 'group-hover:rotate-12')"
          />
          <Sun
            v-else
            :size="18"
            :class="cn('transition-transform', 'group-hover:rotate-45')"
          />
        </button>
        <button
          type="button"
          :class="
            cn(
              'cursor-pointer',
              'font-mono',
              'text-xs',
              'uppercase',
              'text-ink-muted',
              'transition-colors',
              'hover:text-ink',
            )
          "
          @click="i18n.toggleLocale"
        >
          {{ i18n.nextLocaleCode }}
        </button>

        <template v-if="!_props.compact">
          <NuxtLink
            to="/history"
            :class="
              cn(
                'group',
                'flex',
                'items-center',
                'gap-1.5',
                'text-sm',
                'text-ink-muted',
                'no-underline',
                'transition-colors',
                'hover:text-ink',
              )
            "
          >
            <History
              :size="16"
              :class="cn('transition-transform', 'group-hover:-translate-y-px')"
            />
            {{ i18n.t(TranslationKey.navHistory) }}
          </NuxtLink>
          <Button as-child variant="default" size="sm">
            <NuxtLink
              to="/quiz/new"
              :class="cn('flex', 'items-center', 'gap-1.5')"
            >
              <Plus :size="16" />
              {{ i18n.t(TranslationKey.navNewSession) }}
            </NuxtLink>
          </Button>
          <button
            v-if="auth.isAuthed"
            type="button"
            :class="
              cn(
                'group',
                'flex',
                'cursor-pointer',
                'items-center',
                'gap-1.5',
                'text-sm',
                'text-ink-muted',
                'transition-colors',
                'hover:text-ink',
              )
            "
            @click="auth.logout"
          >
            <LogOut
              :size="16"
              :class="cn('transition-transform', 'group-hover:translate-x-0.5')"
            />
            {{ i18n.t(TranslationKey.navLogout) }}
          </button>
        </template>
      </nav>
    </div>
  </header>
</template>
