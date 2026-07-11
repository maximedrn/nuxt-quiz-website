<script setup lang="ts">
import { splitQuestion } from '@/app/lib/quiz/split-question'
import type { AnswerLetter, PlayableQuestion } from '@/shared/types'

export interface QuestionFeedback {
  selected: AnswerLetter
  correct: boolean
  correctAnswer: AnswerLetter
  explanation: string
}

const props = defineProps<{
  question: PlayableQuestion
  feedback: QuestionFeedback | null
}>()

defineEmits<{ pick: [letter: AnswerLetter] }>()

const parts = computed(() => splitQuestion(props.question.question))
const letters: AnswerLetter[] = ['A', 'B', 'C', 'D']

function stateFor(letter: AnswerLetter): 'default' | 'correct' | 'incorrect' | 'muted' {
  const feedback = props.feedback
  if (!feedback) return 'default'
  if (letter === feedback.correctAnswer) return 'correct'
  if (letter === feedback.selected) return 'incorrect'
  return 'muted'
}
</script>

<template>
  <div class="question-card card">
    <div class="question-card__eyebrow eyebrow">Q{{ question.number }} · {{ question.title }}</div>

    <div class="question-card__prose">
      <p>{{ parts.before }}</p>
      <CodeBlock v-if="question.code" :code="question.code" />
      <p v-if="parts.after">{{ parts.after }}</p>
    </div>

    <div class="question-card__options flex-col gap-3">
      <OptionButton
        v-for="letter in letters"
        :key="letter"
        :letter="letter"
        :text="question.options[letter]"
        :state="stateFor(letter)"
        :disabled="!!feedback"
        @pick="$emit('pick', letter)"
      />
    </div>

    <Transition name="fade-up">
      <div
        v-if="feedback"
        class="question-card__feedback"
        :class="feedback.correct ? 'is-correct' : 'is-incorrect'"
      >
        <p class="question-card__feedback-title">
          {{ feedback.correct ? 'Correct.' : 'Incorrect.' }}
        </p>
        <p class="question-card__feedback-text">{{ feedback.explanation }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.question-card {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.question-card__prose {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.question-card__prose p {
  font-size: 1.05rem;
  color: var(--ink);
}

.question-card__feedback {
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border: 1px solid var(--border);
}

.question-card__feedback.is-correct {
  background: var(--success-soft);
  border-color: var(--success);
}
.question-card__feedback.is-incorrect {
  background: var(--danger-soft);
  border-color: var(--danger);
}

.question-card__feedback-title {
  font-family: var(--font-display);
  font-weight: 600;
  margin-bottom: var(--space-2);
}
.is-correct .question-card__feedback-title {
  color: var(--success);
}
.is-incorrect .question-card__feedback-title {
  color: var(--danger);
}

.question-card__feedback-text {
  font-size: 0.92rem;
  color: var(--ink-muted);
  line-height: 1.6;
}

.fade-up-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
</style>
