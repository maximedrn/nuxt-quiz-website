<script setup lang="ts">
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
  <div class="page">
    <AppHeader compact />

    <main class="container new-session">
      <NuxtLink to="/" class="back-link">&larr; Tableau de bord</NuxtLink>

      <h1>Nouvelle session</h1>
      <p class="new-session__subtitle">Choisis la longueur et l'ordre des questions.</p>

      <div class="card new-session__form flex-col gap-6">
        <div class="field flex-col gap-3">
          <p class="eyebrow">Nombre de questions</p>
          <div class="option-pills flex flex-wrap gap-2">
            <button
              v-for="n in sizeOptions"
              :key="n"
              type="button"
              class="pill"
              :class="{ 'is-active': size === n }"
              @click="size = n"
            >
              {{ n === total ? `Toutes (${n})` : n }}
            </button>
          </div>
        </div>

        <div class="field flex-col gap-3">
          <p class="eyebrow">Ordre</p>
          <div class="option-pills flex flex-wrap gap-2">
            <button
              type="button"
              class="pill"
              :class="{ 'is-active': mode === 'random' }"
              @click="mode = 'random'"
            >
              Aléatoire
            </button>
            <button
              type="button"
              class="pill"
              :class="{ 'is-active': mode === 'sequential' }"
              @click="mode = 'sequential'"
            >
              Dans l'ordre
            </button>
          </div>
        </div>

        <p v-if="errorMessage" class="new-session__error">{{ errorMessage }}</p>

        <button type="button" class="btn btn-accent new-session__start" :disabled="isStarting" @click="start">
          {{ isStarting ? 'Démarrage…' : 'Commencer' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.new-session {
  padding-top: var(--space-6);
  padding-bottom: var(--space-8);
  max-width: 560px;
}

.back-link {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--ink-muted);
  text-decoration: none;
  margin-bottom: var(--space-5);
}
.back-link:hover {
  color: var(--ink);
}

h1 {
  margin-bottom: var(--space-2);
}

.new-session__subtitle {
  color: var(--ink-muted);
  margin-bottom: var(--space-6);
}

.new-session__form {
  padding: var(--space-6);
}

.pill {
  border: 1px solid var(--border-strong);
  background: var(--bg-raised);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--ink);
  transition:
    border-color 0.12s ease,
    background 0.12s ease,
    color 0.12s ease;
}
.pill:hover {
  border-color: var(--accent);
}
.pill.is-active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.new-session__start {
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
}

.new-session__error {
  color: var(--danger);
  font-size: 0.88rem;
}
</style>
