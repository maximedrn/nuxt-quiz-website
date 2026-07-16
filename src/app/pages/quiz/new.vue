<script setup lang="ts">
import { navigateTo, useAsyncData, useRoute } from "nuxt/app";
import { type ComputedRef, computed, type Ref, ref, watch } from "vue";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import { type QuizApi, useApi } from "@/app/composables/useApi.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { cn } from "@/app/lib/cn.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";
import type { CreateSessionResult } from "@/app/lib/quiz/quiz.types.ts";
import type { SessionMode as SessionModeType } from "@/app/lib/storage/storage.constants.ts";
import { SessionMode } from "@/app/lib/storage/storage.constants.ts";

const i18n: TypedI18n = useTypedI18n();
const route: RouteLocationNormalizedLoadedGeneric = useRoute();

const quizId: number = Number(route.query.quizId);
if (!quizId) {
  await navigateTo("/");
}

const api: QuizApi = useApi();
const getQuestionCount: (quizId: number) => Promise<{ count: number }> =
  api.getQuestionCount;
const createSession: (input: {
  mode: SessionModeType;
  quizId: number;
  size: number;
}) => Promise<CreateSessionResult> = api.createSession;

const { data: countData }: { data: Ref<{ count: number } | undefined> } =
  await useAsyncData("question-count", (): Promise<{ count: number }> =>
    getQuestionCount(quizId),
  );

const total: ComputedRef<number> = computed(
  (): number => countData.value?.count ?? 90,
);

const _sizeOptions: ComputedRef<number[]> = computed((): number[] => {
  const base: number[] = [10, 20, 50].filter(
    (number: number) => number < total.value,
  );
  return [...base, total.value];
});

const size: Ref<number> = ref(10);
const mode: Ref<SessionModeType> = ref(SessionMode.random);
const isStarting: Ref<boolean> = ref(false);
const errorMessage: Ref<string | null> = ref<string | null>(null);

const pillBase: string = cn(
  "cursor-pointer",
  "rounded-full",
  "border",
  "px-4",
  "py-2",
  "text-[0.88rem]",
  "font-medium",
  "transition-all",
  "hover:-translate-y-px",
  "active:translate-y-0",
);

const _sizeButtonClass: (number: number) => string = (
  number: number,
): string => {
  if (size.value === number) {
    return cn(pillBase, "border-ink", "bg-ink", "text-background");
  }
  return cn(
    pillBase,
    "border-border-strong",
    "bg-surface",
    "text-ink",
    "hover:border-accent",
  );
};

const _modeButtonClass: (_mode: SessionModeType) => string = (
  _mode: SessionModeType,
): string => {
  if (mode.value === _mode) {
    return cn(pillBase, "border-ink", "bg-ink", "text-background");
  }
  return cn(
    pillBase,
    "border-border-strong",
    "bg-surface",
    "text-ink",
    "hover:border-accent",
  );
};

watch(
  total,
  (number: number) => {
    if (size.value > number) {
      size.value = number;
    }
  },
  { immediate: true },
);

const _start: () => Promise<void> = async (): Promise<void> => {
  isStarting.value = true;
  errorMessage.value = null;
  await createSession({ mode: mode.value, quizId, size: size.value })
    .then(async (result: CreateSessionResult): Promise<void> => {
      await navigateTo(`/quiz/${result.id}`);
    })
    .catch((_error: unknown): void => {
      errorMessage.value = i18n.t(TranslationKey.quizNewError);
    });
  isStarting.value = false;
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
          'max-w-140',
          'px-6',
          'pb-16',
          'pt-8',
          'flex',
          'flex-col',
        )
      "
    >
      <NuxtLink
        to="/"
        :class="
          cn(
            'mb-8',
            'inline-block',
            'text-[0.85rem]',
            'text-ink-muted',
            'no-underline',
            'transition-colors',
            'hover:text-ink',
          )
        "
        >&larr; {{ i18n.t(TranslationKey.commonDashboard) }}</NuxtLink
      >

      <h1 :class="cn('mb-2')">{{ i18n.t(TranslationKey.navNewSession) }}</h1>
      <p :class="cn('mb-8', 'text-ink-muted')">
        {{ i18n.t(TranslationKey.quizNewSubtitle) }}
      </p>

      <Card>
        <CardContent :class="cn('flex', 'flex-col', 'gap-6', 'p-6')">
          <div :class="cn('flex', 'flex-col', 'gap-3')">
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
              {{ i18n.t(TranslationKey.quizNewQuestionCount) }}
            </p>
            <div :class="cn('flex', 'flex-wrap', 'gap-2')">
              <button
                v-for="number in _sizeOptions"
                :key="number"
                type="button"
                :class="_sizeButtonClass(number)"
                @click="size = number"
              >
                {{
                  number === total
                    ? i18n.t(TranslationKey.quizNewAll, { count: number })
                    : number
                }}
              </button>
            </div>
          </div>

          <div :class="cn('flex', 'flex-col', 'gap-3')">
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
              {{ i18n.t(TranslationKey.quizNewOrder) }}
            </p>
            <div :class="cn('flex', 'flex-wrap', 'gap-2')">
              <button
                type="button"
                :class="_modeButtonClass(SessionMode.random)"
                @click="mode = SessionMode.random"
              >
                {{ i18n.t(TranslationKey.modeRandom) }}
              </button>
              <button
                type="button"
                :class="_modeButtonClass(SessionMode.sequential)"
                @click="mode = SessionMode.sequential"
              >
                {{ i18n.t(TranslationKey.modeSequential) }}
              </button>
            </div>
          </div>

          <p v-if="errorMessage" :class="cn('text-[0.88rem]', 'text-danger')">
            {{ errorMessage }}
          </p>

          <Button
            :class="cn('w-full', 'py-[0.85rem]', 'text-base')"
            :disabled="isStarting"
            @click="_start"
          >
            {{
              isStarting
                ? i18n.t(TranslationKey.quizNewStarting)
                : i18n.t(TranslationKey.quizNewStart)
            }}
          </Button>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
