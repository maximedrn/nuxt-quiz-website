<script setup lang="ts">
import { type ComputedRef, computed, type DefineProps } from "vue";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { cn } from "@/app/lib/cn.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";
import { OptionButtonState } from "@/app/lib/quiz/option-state.ts";
import { useSplitQuestion } from "@/app/lib/quiz/parser/parser.context.ts";
import type {
  PlayableQuestion,
  QuestionFeedback,
} from "@/app/lib/quiz/quiz.types.ts";
import type { AnswerIndex } from "@/app/lib/storage/storage.types.ts";

interface QuestionCardProps {
  feedback: QuestionFeedback | null;
  question: PlayableQuestion;
}

const props: DefineProps<QuestionCardProps, never> =
  defineProps<QuestionCardProps>();

const i18n: TypedI18n = useTypedI18n();

defineEmits<{ pick: [index: AnswerIndex] }>();

const _parts: ComputedRef<{ before: string; after: string }> = computed(() =>
  useSplitQuestion().parse(props.question.question),
);

/**
 * Visual state of an option button based on current feedback.
 */
const _stateFor: (index: AnswerIndex) => OptionButtonState = (
  index: AnswerIndex,
): OptionButtonState => {
  const feedback: QuestionFeedback | null = props.feedback;
  if (!feedback) {
    return OptionButtonState.default;
  }
  if (index === feedback.correctIndex) {
    return OptionButtonState.correct;
  }
  if (index === feedback.selectedIndex) {
    return OptionButtonState.incorrect;
  }
  return OptionButtonState.muted;
};

const _feedbackBoxClass: ComputedRef<string> = computed((): string =>
  cn(
    "rounded-[var(--radius-md)]",
    "p-4",
    "border",
    props.feedback?.correct && cn("bg-success-soft", "border-success"),
    !props.feedback?.correct && cn("bg-danger-soft", "border-danger"),
  ),
);

const _feedbackLabelClass: ComputedRef<string> = computed((): string =>
  cn(
    "font-display",
    "font-semibold",
    "mb-2",
    props.feedback?.correct && "text-success",
    !props.feedback?.correct && "text-danger",
  ),
);

const _feedbackTitle: ComputedRef<string> = computed((): string => {
  if (props.feedback?.correct) {
    return i18n.t(TranslationKey.questionCorrect);
  }
  return i18n.t(TranslationKey.questionIncorrect);
});
</script>

<template>
  <Card :class="cn('flex', 'flex-col', 'gap-5', 'p-6')">
    <span
      :class="
        cn(
          'font-mono',
          'text-xs',
          'font-medium',
          'uppercase',
          'tracking-wider',
          'text-ink-faint',
        )
      "
    >
      Q{{ props.question.number }} · {{ props.question.title }}
    </span>

    <div :class="cn('flex', 'flex-col', 'gap-2')">
      <p :class="cn('text-[1.05rem]', 'text-ink')">{{ _parts.before }}</p>
      <CodeBlock v-if="props.question.code" :code="props.question.code" />
      <p v-if="_parts.after" :class="cn('text-[1.05rem]', 'text-ink')">
        {{ _parts.after }}
      </p>
    </div>

    <div :class="cn('flex', 'flex-col', 'gap-3')">
      <OptionButton
        v-for="(text, index) in props.question.options"
        :key="index"
        :index="index"
        :text="text"
        :state="_stateFor(index)"
        :disabled="!!props.feedback"
        @pick="$emit('pick', index as AnswerIndex)"
      />
    </div>

    <Transition
      enter-active-class="transition-[opacity,transform] duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
    >
      <div v-if="props.feedback" :class="_feedbackBoxClass">
        <p :class="_feedbackLabelClass">
          {{ _feedbackTitle }}
        </p>
        <p :class="cn('text-[0.92rem]', 'text-ink-muted', 'leading-relaxed')">
          {{ props.feedback.explanation }}
        </p>
      </div>
    </Transition>
  </Card>
</template>
