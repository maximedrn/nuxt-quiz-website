<script setup lang="ts">
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { cn } from '@/app/lib/cn'
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
  <div class="flex min-h-screen flex-col">
    <AppHeader compact />

    <main v-if="results" class="mx-auto w-full max-w-[780px] px-6 pb-16 pt-8 flex flex-col gap-6">
      <Card>
        <CardContent class="flex flex-col gap-2 p-6">
          <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Session terminée</p>
          <h1 class="text-[2.25rem]">{{ results.session.score }}/{{ results.session.total }} · {{ percentage }}%</h1>
          <div class="mt-2 flex gap-3">
            <Button as-child>
              <NuxtLink to="/quiz/new">Nouvelle session</NuxtLink>
            </Button>
            <Button variant="outline" as-child>
              <NuxtLink to="/">Tableau de bord</NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section class="flex flex-col gap-4">
        <article
          v-for="item in results.items"
          :key="item.number"
          :class="cn(
            'flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-surface p-5 shadow-sm border-l-[3px]',
            item.isCorrect ? 'border-l-success' : 'border-l-danger',
          )"
        >
          <div class="flex items-center justify-between">
            <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Q{{ item.number }} · {{ item.title }}</p>
            <span
              :class="cn(
                'font-mono text-[0.72rem] font-semibold uppercase tracking-[0.04em]',
                item.isCorrect ? 'text-success' : 'text-danger',
              )"
            >{{ item.isCorrect ? 'Correct' : 'Incorrect' }}</span>
          </div>

          <p class="text-[0.98rem]">{{ splitQuestion(item.question).before }}</p>
          <CodeBlock v-if="item.code" :code="item.code" />
          <p v-if="splitQuestion(item.question).after" class="text-[0.98rem]">
            {{ splitQuestion(item.question).after }}
          </p>

          <ul class="m-0 list-none p-0 flex flex-col gap-2">
            <li
              v-for="letter in letters"
              :key="letter"
              class="flex items-start gap-3 rounded-[var(--radius-sm)] border px-3 py-2 text-[0.88rem]"
              :class="optionClass(item, letter) === 'is-correct'
                ? 'border-success bg-success-soft text-ink'
                : optionClass(item, letter) === 'is-incorrect'
                  ? 'border-danger bg-danger-soft text-ink'
                  : 'border-border text-ink-muted'"
            >
              <span class="flex-none font-mono text-[0.75rem] font-semibold">{{ letter }}</span>
              <span>{{ item.options[letter] }}</span>
            </li>
          </ul>

          <p class="border-t border-border pt-2 text-[0.88rem] text-ink-muted leading-[1.6]">{{ item.explanation }}</p>
        </article>
      </section>
    </main>
  </div>
</template>
