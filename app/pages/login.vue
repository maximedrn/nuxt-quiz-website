<script setup lang="ts">
import is from '@sindresorhus/is'
import { FetchError } from 'ofetch'
import { TranslationKey } from '@/app/lib/i18n/i18n.keys'

const { t } = useTypedI18n()
const { register, login } = useAuth()

const code = ref('')
const error = ref('')
const pending = ref(false)

const isValid = computed(() => /^\d{8}$/.test(code.value))

/** Runs a login or register flow and redirects home on success. */
async function run(kind: 'login' | 'register') {
  error.value = ''
  if (!isValid.value) {
    error.value = t(TranslationKey.LoginInvalidCode)
    return
  }
  pending.value = true
  await (kind === 'login' ? login : register)(code.value)
    .then(() => navigateTo('/'))
    .catch((err: unknown) => {
      error.value =
        err instanceof FetchError && is.plainObject(err.data) && is.string(err.data.statusMessage)
          ? err.data.statusMessage
          : t(TranslationKey.LoginInvalidCode)
    })
  pending.value = false
}
</script>

<template>
  <div class="page">
    <AppHeader :compact="true" />
    <main class="flex flex-1 items-center justify-center px-6 py-12">
      <div class="card flex w-full max-w-sm flex-col gap-5 p-8">
        <div class="flex flex-col gap-1">
          <p class="eyebrow">{{ t(TranslationKey.LoginTitle) }}</p>
          <h1 class="text-2xl">{{ t(TranslationKey.LoginSubtitle) }}</h1>
        </div>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-ink-muted">{{ t(TranslationKey.LoginCodeLabel) }}</span>
          <input
            v-model="code"
            type="password"
            inputmode="numeric"
            autocomplete="off"
            maxlength="8"
            :placeholder="t(TranslationKey.LoginCodePlaceholder)"
            class="rounded-md border border-border-strong bg-bg px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-accent"
            @keyup.enter="run('login')"
          />
        </label>

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button type="button" class="btn btn-accent flex-1" :disabled="pending" @click="run('login')">
            {{ t(TranslationKey.LoginSignIn) }}
          </button>
          <button type="button" class="btn btn-ghost flex-1" :disabled="pending" @click="run('register')">
            {{ t(TranslationKey.LoginRegister) }}
          </button>
        </div>

        <p class="text-xs text-ink-faint">{{ t(TranslationKey.LoginHint) }}</p>
      </div>
    </main>
  </div>
</template>
