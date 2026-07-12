<script setup lang="ts">
import is from '@sindresorhus/is'
import { FetchError } from 'ofetch'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
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
  <div class="flex min-h-screen flex-col">
    <AppHeader :compact="true" />
    <main class="flex flex-1 items-center justify-center px-6 py-12">
      <Card class="w-full max-w-sm">
        <CardContent class="flex flex-col gap-5 p-8">
          <div class="flex flex-col gap-1">
            <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">{{ t(TranslationKey.LoginTitle) }}</p>
            <h1 class="text-2xl">{{ t(TranslationKey.LoginSubtitle) }}</h1>
          </div>

          <div class="flex flex-col gap-2">
            <Label>{{ t(TranslationKey.LoginCodeLabel) }}</Label>
            <Input
              v-model="code"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              maxlength="8"
              :placeholder="t(TranslationKey.LoginCodePlaceholder)"
              class="text-center font-mono text-lg tracking-[0.3em]"
              @keyup.enter="run('login')"
            />
          </div>

          <p v-if="error" class="text-sm text-danger">{{ error }}</p>

          <div class="flex flex-col gap-2 sm:flex-row">
            <Button class="flex-1" :disabled="pending" @click="run('login')">
              {{ t(TranslationKey.LoginSignIn) }}
            </Button>
            <Button variant="outline" class="flex-1" :disabled="pending" @click="run('register')">
              {{ t(TranslationKey.LoginRegister) }}
            </Button>
          </div>

          <p class="text-xs text-ink-faint">{{ t(TranslationKey.LoginHint) }}</p>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
