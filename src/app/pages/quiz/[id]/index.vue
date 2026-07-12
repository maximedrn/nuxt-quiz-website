<script setup lang="ts">
import { navigateTo, useAsyncData, useRoute } from "nuxt/app";
import { type ComputedRef, computed, type Ref, ref } from "vue";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import { type QuizApi, useApi } from "@/app/composables/useApi.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";
import {
  AnswerOutcome,
  type ProgressResult,
} from "@/app/lib/quiz/option-state.ts";
import type {
  PlayableQuestion,
  QuestionFeedback as QuestionFeedbackType,
  SessionProgress,
  SessionStateResult,
  SubmitAnswerResult,
} from "@/app/lib/quiz/quiz.types.ts";
import { SessionStatus } from "@/app/lib/storage/storage.constants.ts";
import type { AnswerIndex } from "@/app/lib/storage/storage.types.ts";

const i18n: TypedI18n = useTypedI18n();
const route: RouteLocationNormalizedLoadedGeneric = useRoute();
const sessionId: ComputedRef<number> = computed((): number =>
  Number(route.params.id),
);

const api: QuizApi = useApi();
const getSessionState: (id: number) => Promise<SessionStateResult> =
  api.getSessionState;
const submitAnswer: (
  id: number,
  input: { questionId: number; selectedIndex: AnswerIndex },
) => Promise<SubmitAnswerResult> = api.submitAnswer;
const finishSession: (id: number) => Promise<{ score: number; total: number }> =
  api.finishSession;

// SSR-friendly initial load: the first question renders server-side instead
// of behind a client-only loading flash. If the session is already
// complete (or just needs finishing), redirect before anything renders.
const {
  data: initialState,
  error: _loadError,
}: { data: Ref<SessionStateResult | null>; error: Ref<Error | null> } =
  await useAsyncData(`quiz-session-${sessionId.value}`, () =>
    getSessionState(sessionId.value),
  );

if (initialState.value?.session.status === SessionStatus.completed) {
  await navigateTo(`/quiz/${sessionId.value}/results`);
} else if (initialState.value?.needsFinish) {
  await finishSession(sessionId.value);
  await navigateTo(`/quiz/${sessionId.value}/results`);
}

const question: Ref<PlayableQuestion | null> = ref<PlayableQuestion | null>(
  initialState.value?.currentQuestion ?? null,
);
const progress: Ref<SessionProgress> = ref<SessionProgress>(
  initialState.value?.progress ?? { current: 0, total: 0 },
);
const resultsSoFar: Ref<AnswerOutcome[]> = ref<AnswerOutcome[]>(
  initialState.value?.answeredResults ?? [],
);
const feedback: Ref<QuestionFeedbackType | null> =
  ref<QuestionFeedbackType | null>(null);
const isLoading: Ref<boolean> = ref(false);
const isSubmitting: Ref<boolean> = ref(false);
const errorMessage: Ref<string | null> = ref<string | null>(null);

const _chainResults: ComputedRef<ProgressResult[]> = computed<ProgressResult[]>(
  (): ProgressResult[] => {
    const total: number = progress.value.total;
    return Array.from(
      { length: total },
      (_, i) => resultsSoFar.value[i] ?? null,
    );
  },
);

const isLastQuestion: ComputedRef<boolean> = computed(
  (): boolean => progress.value.current >= progress.value.total,
);

const applyState: () => Promise<void> = async (): Promise<void> => {
  const state: SessionStateResult = await getSessionState(sessionId.value);

  if (state.session.status === SessionStatus.completed) {
    await navigateTo(`/quiz/${sessionId.value}/results`);
    return;
  }

  if (state.needsFinish) {
    await finishSession(sessionId.value);
    await navigateTo(`/quiz/${sessionId.value}/results`);
    return;
  }

  question.value = state.currentQuestion;
  progress.value = state.progress;
  resultsSoFar.value = state.answeredResults;
  feedback.value = null;
};

const loadState: () => Promise<void> = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = null;
  await applyState().catch((_error: unknown) => {
    errorMessage.value = i18n.t(TranslationKey.quizPlayErrorLoad);
  });
  isLoading.value = false;
};

const _handlePick: (index: AnswerIndex) => Promise<void> = async (
  index: AnswerIndex,
): Promise<void> => {
  const current: PlayableQuestion | null = question.value;
  if (feedback.value || !current || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  await submitAnswer(sessionId.value, {
    questionId: current.id,
    selectedIndex: index,
  })
    .then((result: SubmitAnswerResult): void => {
      feedback.value = {
        correct: result.correct,
        correctIndex: result.correctIndex,
        explanation: result.explanation,
        selectedIndex: index,
      };
      let outcome: AnswerOutcome;
      if (result.correct) {
        outcome = AnswerOutcome.correct;
      } else {
        outcome = AnswerOutcome.incorrect;
      }
      resultsSoFar.value = [...resultsSoFar.value, outcome];
    })
    .catch((_error: unknown): void => {
      errorMessage.value = i18n.t(TranslationKey.quizPlayErrorSubmit);
    });
  isSubmitting.value = false;
};

const _next: () => Promise<void> = async (): Promise<void> => {
  if (isLastQuestion.value) {
    isLoading.value = true;
    await finishSession(sessionId.value)
      .then(async (): Promise<void> => {
        await navigateTo(`/quiz/${sessionId.value}/results`);
      })
      .catch((_error: unknown): void => {
        errorMessage.value = i18n.t(TranslationKey.quizPlayErrorFinish);
        isLoading.value = false;
      });
    return;
  }
  await loadState();
};
</script>

<template>
  <div :class="cn('flex', 'min-h-screen', 'flex-col')">
    <AppHeader compact />

    <main
      :class="
        cn(
          'mx-auto',
          'w-full',
          'max-w-195',
          'px-6',
          'pb-16',
          'pt-6',
          'flex',
          'flex-col',
          'gap-5',
        )
      "
    >
      <div :class="cn('flex', 'flex-col', 'gap-3')">
        <div :class="cn('flex', 'items-center', 'justify-between')">
          <NuxtLink
            to="/"
            :class="
              cn(
                'text-[0.85rem]',
                'text-ink-muted',
                'no-underline',
                'transition-colors',
                'hover:text-ink',
              )
            "
            >{{ i18n.t(TranslationKey.quizPlayQuit) }}</NuxtLink
          >
          <span
            v-if="progress.total > 0"
            :class="
              cn(
                'flex-none',
                'font-mono',
                'text-xs',
                'font-medium',
                'uppercase',
                'tracking-wider',
                'text-ink-faint',
              )
            "
          >
            {{ progress.current }} / {{ progress.total }}
          </span>
        </div>
        <ProgressChain
          v-if="progress.total > 0"
          :results="_chainResults"
          :current-index="progress.current - 1"
        />
      </div>

      <p v-if="errorMessage" :class="cn('text-[0.9rem]', 'text-danger')">
        {{ errorMessage }}
      </p>

      <Card v-if="isLoading && !question">
        <CardContent :class="cn('p-6', 'text-center', 'text-ink-muted')">
          <p>{{ i18n.t(TranslationKey.commonLoading) }}</p>
        </CardContent>
      </Card>

      <template v-else-if="question">
        <QuestionCard
          :question="question"
          :feedback="feedback"
          @pick="_handlePick"
        />

        <div :class="cn('flex', 'min-h-11', 'justify-end')">
          <Button v-if="feedback" :disabled="isLoading" @click="_next">
            {{
              isLastQuestion
                ? i18n.t(TranslationKey.quizPlayFinish)
                : i18n.t(TranslationKey.quizPlayNextQuestion)
            }}
          </Button>
        </div>
      </template>
    </main>
  </div>
</template>
