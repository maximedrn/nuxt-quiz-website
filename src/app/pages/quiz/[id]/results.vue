<script setup lang="ts">
import { navigateTo, useAsyncData, useRoute } from "nuxt/app";
import { type ComputedRef, computed } from "vue";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import { type QuizApi, useApi } from "@/app/composables/useApi.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { cn } from "@/app/lib/cn.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";
import { useAnswerLetter } from "@/app/lib/quiz/labeler/labeler.context.ts";
import { OptionButtonState } from "@/app/lib/quiz/option-state.ts";
import { useSplitQuestion } from "@/app/lib/quiz/parser/parser.context.ts";
import type { QuestionParts } from "@/app/lib/quiz/parser/parser.types.ts";
import type {
  ReviewItem,
  SessionResultsResult,
  SessionSummary,
} from "@/app/lib/quiz/quiz.types.ts";
import type { AnswerIndex } from "@/app/lib/storage/storage.types.ts";

const i18n: TypedI18n = useTypedI18n();
const route: RouteLocationNormalizedLoadedGeneric = useRoute();
const sessionId: ComputedRef<number> = computed((): number =>
  Number(route.params.id),
);

const api: QuizApi = useApi();
const getSessionResults: (id: number) => Promise<SessionResultsResult> =
  api.getSessionResults;

const {
  data,
  error,
}: { data: Ref<SessionResultsResult | null>; error: Ref<unknown> } =
  await useAsyncData(
    `results-${sessionId.value}`,
    (): Promise<SessionResultsResult> => getSessionResults(sessionId.value),
  );

if (error.value) {
  // Most likely: the session isn't finished yet — send the person back to play it out.
  await navigateTo(`/quiz/${sessionId.value}`);
}

const results: ComputedRef<SessionResultsResult | null> = computed(
  () => data.value,
);
const _percentage: ComputedRef<number> = computed(() => {
  const session: SessionSummary | undefined = results.value?.session;
  if (!session?.total) {
    return 0;
  }
  return Math.round(((session.score ?? 0) / session.total) * 100);
});

/**
 * State of a single option row in the review list.
 */
const optionState: (
  item: ReviewItem,
  index: AnswerIndex,
) => OptionButtonState = (
  item: ReviewItem,
  index: AnswerIndex,
): OptionButtonState => {
  if (index === item.correctIndex) {
    return OptionButtonState.correct;
  }
  if (index === item.selectedIndex && !item.isCorrect) {
    return OptionButtonState.incorrect;
  }
  return OptionButtonState.muted;
};

/**
 * Class list for a review option row.
 */
const _optionClass: (item: ReviewItem, index: AnswerIndex) => string = (
  item: ReviewItem,
  index: AnswerIndex,
): string => {
  const state: OptionButtonState = optionState(item, index);
  return cn(
    "flex",
    "items-start",
    "gap-3",
    "rounded-[var(--radius-sm)]",
    "border",
    "px-3",
    "py-2",
    "text-[0.88rem]",
    state === OptionButtonState.correct &&
      cn("border-success", "bg-success-soft", "text-ink"),
    state === OptionButtonState.incorrect &&
      cn("border-danger", "bg-danger-soft", "text-ink"),
    state === OptionButtonState.muted && cn("border-border", "text-ink-muted"),
  );
};

// Enum + template-only helpers aren't auto-imported; alias so the template
// resolves them while their imports count as used in this script.
const _splitQuestion: (question: string) => QuestionParts =
  useSplitQuestion().parse;
const _optionLabel: (index: AnswerIndex) => string =
  useAnswerLetter().optionLabel;
</script>

<template>
  <div :class="cn('flex', 'min-h-screen', 'flex-col')">
    <AppHeader compact />

    <main
      v-if="results"
      :class="
        cn(
          'mx-auto',
          'w-full',
          'max-w-195',
          'px-6',
          'pb-16',
          'pt-8',
          'flex',
          'flex-col',
          'gap-6',
        )
      "
    >
      <Card>
        <CardContent :class="cn('flex', 'flex-col', 'gap-2', 'p-6')">
          <p
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
            {{ i18n.t(TranslationKey.resultsSessionComplete) }}
          </p>
          <h1 :class="cn('text-[2.25rem]')">
            {{ results.session.score }}/{{ results.session.total }} ·
            {{ _percentage }}%
          </h1>
          <div :class="cn('mt-2', 'flex', 'gap-3')">
            <Button as-child>
              <NuxtLink to="/quiz/new">{{
                i18n.t(TranslationKey.navNewSession)
              }}</NuxtLink>
            </Button>
            <Button variant="outline" as-child>
              <NuxtLink to="/">{{
                i18n.t(TranslationKey.commonDashboard)
              }}</NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section :class="cn('flex', 'flex-col', 'gap-4')">
        <article
          v-for="item in results.items"
          :key="item.number"
          :class="
            cn(
              'flex',
              'flex-col',
              'gap-3',
              'rounded-(--radius-lg)',
              'border',
              'bg-surface',
              'p-5',
              'shadow-sm',
              'border-l-[3px]',
              item.isCorrect ? 'border-l-success' : 'border-l-danger',
            )
          "
        >
          <div :class="cn('flex', 'items-center', 'justify-between')">
            <p
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
              Q{{ item.number }} · {{ item.title }}
            </p>
            <span
              :class="
                cn(
                  'font-mono',
                  'text-[0.72rem]',
                  'font-semibold',
                  'uppercase',
                  'tracking-[0.04em]',
                  item.isCorrect ? 'text-success' : 'text-danger',
                )
              "
              >{{
                item.isCorrect
                  ? i18n.t(TranslationKey.resultsCorrect)
                  : i18n.t(TranslationKey.resultsIncorrect)
              }}</span
            >
          </div>

          <p :class="cn('text-[0.98rem]')">
            {{ _splitQuestion(item.question).before }}
          </p>
          <CodeBlock v-if="item.code" :code="item.code" />
          <p
            v-if="_splitQuestion(item.question).after"
            :class="cn('text-[0.98rem]')"
          >
            {{ _splitQuestion(item.question).after }}
          </p>

          <ul
            :class="cn('m-0', 'list-none', 'p-0', 'flex', 'flex-col', 'gap-2')"
          >
            <li
              v-for="(text, index) in item.options"
              :key="index"
              :class="_optionClass(item, index as AnswerIndex)"
            >
              <span
                :class="
                  cn(
                    'flex-none',
                    'font-mono',
                    'text-[0.75rem]',
                    'font-semibold',
                  )
                "
                >{{ _optionLabel(index as AnswerIndex) }}</span
              >
              <span>{{ text }}</span>
            </li>
          </ul>

          <p
            :class="
              cn(
                'border-t',
                'border-border',
                'pt-2',
                'text-[0.88rem]',
                'text-ink-muted',
                'leading-[1.6]',
              )
            "
          >
            {{ item.explanation }}
          </p>
        </article>
      </section>
    </main>
  </div>
</template>
