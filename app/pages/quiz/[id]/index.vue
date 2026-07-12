<script setup lang="ts">
import type { QuestionFeedback } from '@/app/components/QuestionCard.vue'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import type { AnswerLetter, PlayableQuestion, SessionProgress } from '@/shared/types'

const route = useRoute()
const sessionId = computed(() => Number(route.params.id))

const { getSessionState, submitAnswer, finishSession } = useApi()

// SSR-friendly initial load: the first question renders server-side instead
// of behind a client-only loading flash. If the session is already
// complete (or just needs finishing), redirect before anything renders.
const { data: initialState } = await useAsyncData(`quiz-session-${sessionId.value}`, () =>
  getSessionState(sessionId.value),
)

if (initialState.value?.session.status === 'completed') {
  await navigateTo(`/quiz/${sessionId.value}/results`)
} else if (initialState.value?.needsFinish) {
  await finishSession(sessionId.value)
  await navigateTo(`/quiz/${sessionId.value}/results`)
}

const question = ref<PlayableQuestion | null>(initialState.value?.currentQuestion ?? null)
const progress = ref<SessionProgress>(initialState.value?.progress ?? { current: 0, total: 0 })
const resultsSoFar = ref<Array<'correct' | 'incorrect'>>(initialState.value?.answeredResults ?? [])
const feedback = ref<QuestionFeedback | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const chainResults = computed<Array<'correct' | 'incorrect' | null>>(() => {
  const total = progress.value.total
  return Array.from({ length: total }, (_, i) => resultsSoFar.value[i] ?? null)
})

const isLastQuestion = computed(() => progress.value.current >= progress.value.total)

async function loadState() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const state = await getSessionState(sessionId.value)

    if (state.session.status === 'completed') {
      await navigateTo(`/quiz/${sessionId.value}/results`)
      return
    }

    if (state.needsFinish) {
      await finishSession(sessionId.value)
      await navigateTo(`/quiz/${sessionId.value}/results`)
      return
    }

    question.value = state.currentQuestion
    progress.value = state.progress
    resultsSoFar.value = state.answeredResults
    feedback.value = null
  } catch (error) {
    errorMessage.value = 'Impossible de charger cette session.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function handlePick(letter: AnswerLetter) {
  if (feedback.value || !question.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const result = await submitAnswer(sessionId.value, {
      questionId: question.value.id,
      selected: letter,
    })
    feedback.value = {
      selected: letter,
      correct: result.correct,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
    }
    resultsSoFar.value = [...resultsSoFar.value, result.correct ? 'correct' : 'incorrect']
  } catch (error) {
    errorMessage.value = "Impossible d'enregistrer cette réponse."
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

async function next() {
  if (isLastQuestion.value) {
    isLoading.value = true
    try {
      await finishSession(sessionId.value)
      await navigateTo(`/quiz/${sessionId.value}/results`)
    } catch (error) {
      errorMessage.value = 'Impossible de terminer la session.'
      console.error(error)
      isLoading.value = false
    }
    return
  }
  await loadState()
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader compact />

    <main class="mx-auto w-full max-w-[780px] px-6 pb-16 pt-6 flex flex-col gap-5">
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="text-[0.85rem] text-ink-muted no-underline hover:text-ink">Quitter la session</NuxtLink>
          <span v-if="progress.total > 0" class="flex-none font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">
            {{ progress.current }} / {{ progress.total }}
          </span>
        </div>
        <ProgressChain v-if="progress.total > 0" :results="chainResults" :current-index="progress.current - 1" />
      </div>

      <p v-if="errorMessage" class="text-[0.9rem] text-danger">{{ errorMessage }}</p>

      <Card v-if="isLoading && !question">
        <CardContent class="p-6 text-center text-ink-muted">
          <p>Chargement…</p>
        </CardContent>
      </Card>

      <template v-else-if="question">
        <QuestionCard :question="question" :feedback="feedback" @pick="handlePick" />

        <div class="flex min-h-[2.75rem] justify-end">
          <Button
            v-if="feedback"
            :disabled="isLoading"
            @click="next"
          >
            {{ isLastQuestion ? 'Terminer la session' : 'Question suivante' }}
          </Button>
        </div>
      </template>
    </main>
  </div>
</template>
