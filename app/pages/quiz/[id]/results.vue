<script setup lang="ts">
import { splitQuestion } from '@/app/lib/quiz/split-question'
import type { AnswerLetter, ReviewItem } from '@/shared/types'

const route = useRoute()
const sessionId = computed(() => Number(route.params.id))
const { getSessionResults } = useApi()

const { data, error } = await useAsyncData(`results-${sessionId.value}`, () =>
  getSessionResults(sessionId.value),
)

if (error.value) {
  // Most likely: the session isn't finished yet — send the person back to play it out.
  await navigateTo(`/quiz/${sessionId.value}`)
}

const results = computed(() => data.value)
const percentage = computed(() => {
  const s = results.value?.session
  if (!s?.total) return 0
  return Math.round(((s.score ?? 0) / s.total) * 100)
})

const letters: AnswerLetter[] = ['A', 'B', 'C', 'D']

function optionClass(item: ReviewItem, letter: AnswerLetter) {
  if (letter === item.correctAnswer) return 'is-correct'
  if (letter === item.selected && !item.isCorrect) return 'is-incorrect'
  return ''
}
</script>

<template>
  <div class="page">
    <AppHeader compact />

    <main v-if="results" class="container quiz-results">
      <section class="score-banner card flex-col gap-2">
        <p class="eyebrow">Session terminée</p>
        <h1>{{ results.session.score }}/{{ results.session.total }} · {{ percentage }}%</h1>
        <div class="score-banner__actions flex gap-3">
          <NuxtLink to="/quiz/new" class="btn btn-accent">Nouvelle session</NuxtLink>
          <NuxtLink to="/" class="btn btn-ghost">Tableau de bord</NuxtLink>
        </div>
      </section>

      <section class="review flex-col gap-4">
        <article
          v-for="item in results.items"
          :key="item.number"
          class="review-item card"
          :class="item.isCorrect ? 'is-correct' : 'is-incorrect'"
        >
          <div class="review-item__head flex items-center justify-between">
            <p class="eyebrow">Q{{ item.number }} · {{ item.title }}</p>
            <span class="review-item__badge">{{ item.isCorrect ? 'Correct' : 'Incorrect' }}</span>
          </div>

          <p class="review-item__question">{{ splitQuestion(item.question).before }}</p>
          <CodeBlock v-if="item.code" :code="item.code" />
          <p v-if="splitQuestion(item.question).after" class="review-item__question">
            {{ splitQuestion(item.question).after }}
          </p>

          <ul class="review-item__options">
            <li v-for="letter in letters" :key="letter" class="review-item__option" :class="optionClass(item, letter)">
              <span class="review-item__letter">{{ letter }}</span>
              <span>{{ item.options[letter] }}</span>
            </li>
          </ul>

          <p class="review-item__explanation">{{ item.explanation }}</p>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.quiz-results {
  padding-top: var(--space-6);
  padding-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.score-banner {
  padding: var(--space-6);
}

.score-banner h1 {
  font-size: 2.25rem;
}

.score-banner__actions {
  margin-top: var(--space-2);
}

.review-item {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-left: 3px solid var(--border);
}
.review-item.is-correct {
  border-left-color: var(--success);
}
.review-item.is-incorrect {
  border-left-color: var(--danger);
}

.review-item__badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.is-correct .review-item__badge {
  color: var(--success);
}
.is-incorrect .review-item__badge {
  color: var(--danger);
}

.review-item__question {
  font-size: 0.98rem;
}

.review-item__options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.review-item__option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-size: 0.88rem;
  color: var(--ink-muted);
}

.review-item__option.is-correct {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--ink);
}
.review-item__option.is-incorrect {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--ink);
}

.review-item__letter {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  flex: none;
}

.review-item__explanation {
  font-size: 0.88rem;
  color: var(--ink-muted);
  line-height: 1.6;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border);
}
</style>
