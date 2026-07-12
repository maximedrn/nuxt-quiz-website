<script setup lang="ts">
import { cn } from '@/app/lib/cn'
import { splitQuestion } from '@/app/lib/quiz/split-question'
import type { AnswerLetter, PlayableQuestion } from '@/shared/types'

/** Feedback for a single answered question — correct/incorrect state plus explanation. */
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
  <Card class="flex flex-col gap-5 p-6">
    <span class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">
      Q{{ question.number }} · {{ question.title }}
    </span>

    <div class="flex flex-col gap-2">
      <p class="text-[1.05rem] text-ink">{{ parts.before }}</p>
      <CodeBlock v-if="question.code" :code="question.code" />
      <p v-if="parts.after" class="text-[1.05rem] text-ink">{{ parts.after }}</p>
    </div>

    <div class="flex flex-col gap-3">
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

    <Transition
      enter-active-class="transition-[opacity,transform] duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
    >
      <div
        v-if="feedback"
        :class="cn(
          'rounded-[var(--radius-md)]',
          'p-4',
          'border',
          feedback.correct ? 'bg-success-soft border-success' : 'bg-danger-soft border-danger',
        )"
      >
        <p
          :class="cn(
            'font-display',
            'font-semibold',
            'mb-2',
            feedback.correct ? 'text-success' : 'text-danger',
          )"
        >
          {{ feedback.correct ? 'Correct.' : 'Incorrect.' }}
        </p>
        <p class="text-[0.92rem] text-ink-muted leading-relaxed">{{ feedback.explanation }}</p>
      </div>
    </Transition>
  </Card>
</template>
