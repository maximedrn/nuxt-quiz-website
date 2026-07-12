<script setup lang="ts">
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import type { SessionMode } from '@/shared/types'

const { getQuestionCount, createSession } = useApi()
const { data: countData } = await useAsyncData('question-count', () => getQuestionCount())
const total = computed(() => countData.value?.count ?? 90)

const sizeOptions = computed(() => {
  const base = [10, 20, 50].filter((n) => n < total.value)
  return [...base, total.value]
})

const size = ref(10)
const mode = ref<SessionMode>('random')
const isStarting = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  total,
  (t) => {
    if (size.value > t) size.value = t
  },
  { immediate: true },
)

async function start() {
  isStarting.value = true
  errorMessage.value = null
  try {
    const result = await createSession({ size: size.value, mode: mode.value })
    await navigateTo(`/quiz/${result.id}`)
  } catch (error) {
    errorMessage.value =
      'Impossible de démarrer la session. Vérifie que la base de données est bien accessible.'
    console.error(error)
  } finally {
    isStarting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader compact />

    <main class="mx-auto w-full max-w-[560px] px-6 pb-16 pt-8 flex flex-col">
      <NuxtLink to="/" class="mb-8 inline-block text-[0.85rem] text-ink-muted no-underline hover:text-ink">&larr; Tableau de bord</NuxtLink>

      <h1 class="mb-2">Nouvelle session</h1>
      <p class="mb-8 text-ink-muted">Choisis la longueur et l'ordre des questions.</p>

      <Card>
        <CardContent class="flex flex-col gap-6 p-6">
          <div class="flex flex-col gap-3">
            <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Nombre de questions</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="n in sizeOptions"
                :key="n"
                type="button"
                class="cursor-pointer rounded-full border px-4 py-2 text-[0.88rem] font-medium transition-colors"
                :class="size === n
                  ? 'border-ink bg-ink text-white'
                  : 'border-border-strong bg-surface text-ink hover:border-accent'"
                @click="size = n"
              >
                {{ n === total ? `Toutes (${n})` : n }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Ordre</p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="cursor-pointer rounded-full border px-4 py-2 text-[0.88rem] font-medium transition-colors"
                :class="mode === 'random'
                  ? 'border-ink bg-ink text-white'
                  : 'border-border-strong bg-surface text-ink hover:border-accent'"
                @click="mode = 'random'"
              >
                Aléatoire
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-full border px-4 py-2 text-[0.88rem] font-medium transition-colors"
                :class="mode === 'sequential'
                  ? 'border-ink bg-ink text-white'
                  : 'border-border-strong bg-surface text-ink hover:border-accent'"
                @click="mode = 'sequential'"
              >
                Dans l'ordre
              </button>
            </div>
          </div>

          <p v-if="errorMessage" class="text-[0.88rem] text-danger">{{ errorMessage }}</p>

          <Button class="w-full py-[0.85rem] text-base" :disabled="isStarting" @click="start">
            {{ isStarting ? 'Démarrage…' : 'Commencer' }}
          </Button>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
