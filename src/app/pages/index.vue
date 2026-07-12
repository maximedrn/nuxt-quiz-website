<script setup lang="ts">
import is from "@sindresorhus/is";
import { useAsyncData } from "nuxt/app";
import { type ComputedRef, computed, type Ref } from "vue";
import { type QuizApi, useApi } from "@/app/composables/useApi.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";
import { SessionMode } from "@/app/lib/storage/storage.constants.ts";
import type {
  StatsResult,
  StoredQuiz,
  TrendPoint,
} from "@/app/lib/storage/storage.types.ts";

const i18n: TypedI18n = useTypedI18n();

const api: QuizApi = useApi();

const { data: quizzes }: { data: Ref<StoredQuiz[] | undefined> } =
  await useAsyncData("quizzes", (): Promise<StoredQuiz[]> => api.listQuizzes());

const getStats: () => Promise<StatsResult> = api.getStats;
const { data: stats, status: _status } = await useAsyncData(
  "dashboard-stats",
  (): Promise<StatsResult> => getStats(),
);

const _hasHistory: ComputedRef<boolean> = computed(
  (): boolean => (stats.value?.completedSessions ?? 0) > 0,
);

const _percentage: (number: number | null | undefined) => string = (
  number: number | null | undefined,
): string => {
  if (is.null(number)) {
    return "—";
  }
  return `${number}%`;
};

const _trendPoints: ComputedRef<number[]> = computed(
  (): number[] =>
    stats.value?.trend.map((trendPoint: TrendPoint) => trendPoint.percentage) ??
    [],
);

const _formatDate: (iso: string) => string = (iso: string): string =>
  new Intl.DateTimeFormat(i18n.locale.value, {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
</script>

<template>
  <div :class="cn('flex', 'min-h-screen', 'flex-col')">
    <AppHeader />

    <main
      :class="
        cn(
          'mx-auto',
          'w-full',
          'max-w-195',
          'px-6',
          'pb-16',
          'pt-10',
          'flex',
          'flex-col',
          'gap-6',
        )
      "
    >
      <section :class="cn('flex', 'flex-col', 'gap-3')">
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
          {{ i18n.t(TranslationKey.dashboardEyebrow) }}
        </p>
        <h1>{{ i18n.t(TranslationKey.dashboardTitle) }}</h1>
        <p :class="cn('text-[1.02rem]', 'text-ink-muted', 'max-w-[46ch]')">
          {{ i18n.t(TranslationKey.dashboardDescription) }}
        </p>
        <Button
          v-if="_hasHistory"
          variant="outline"
          as-child
          :class="cn('mt-2', 'w-fit')"
        >
          <NuxtLink to="/history">{{
            i18n.t(TranslationKey.dashboardViewHistory)
          }}</NuxtLink>
        </Button>
      </section>

      <section :class="cn('flex', 'flex-col', 'gap-3')">
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
          {{ i18n.t(TranslationKey.quizListTitle) }}
        </p>
        <p v-if="!quizzes?.length" :class="cn('text-ink-muted')">
          {{ i18n.t(TranslationKey.quizListEmpty) }}
        </p>
        <div v-else :class="cn('flex', 'flex-wrap', 'gap-4')">
          <Card
            v-for="quiz in quizzes"
            :key="quiz.id"
            :class="cn('flex-1', 'min-w-60', 'max-w-sm')"
          >
            <CardHeader>
              <CardTitle>{{ quiz.title }}</CardTitle>
              <CardDescription v-if="quiz.description">{{
                quiz.description
              }}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button as-child>
                <NuxtLink :to="`/quiz/new?quizId=${quiz.id}`">{{
                  i18n.t(TranslationKey.quizListStart)
                }}</NuxtLink>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Card v-if="_status === 'pending'">
        <CardContent :class="cn('p-6')">
          <p>{{ i18n.t(TranslationKey.commonLoading) }}</p>
        </CardContent>
      </Card>

      <template v-else-if="stats && _hasHistory">
        <section :class="cn('flex', 'flex-wrap', 'gap-4')">
          <StatCard
            :label="i18n.t(TranslationKey.dashboardCompletedSessions)"
            :value="String(stats.completedSessions)"
          />
          <StatCard
            :label="i18n.t(TranslationKey.dashboardAverageScore)"
            :value="_percentage(stats.averageScorePercentage)"
          />
          <StatCard
            :label="i18n.t(TranslationKey.dashboardBestScore)"
            :value="_percentage(stats.bestScorePercentage)"
          />
          <StatCard
            :label="i18n.t(TranslationKey.dashboardOverallAccuracy)"
            :value="_percentage(stats.overallAccuracyPercentage)"
            :hint="
              i18n.t(TranslationKey.dashboardAnswers, {
                count: stats.totalAnswered,
              })
            "
          />
          <StatCard
            :label="i18n.t(TranslationKey.dashboardCurrentStreak)"
            :value="
              i18n.t(TranslationKey.dashboardStreakValue, {
                count: stats.currentStreakDays,
              })
            "
            :hint="
              stats.currentStreakDays > 0
                ? i18n.t(TranslationKey.dashboardStreakActive)
                : i18n.t(TranslationKey.dashboardStreakInactive)
            "
          />
        </section>

        <Card>
          <CardContent :class="cn('p-5', 'flex', 'flex-col', 'gap-3')">
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
              {{ i18n.t(TranslationKey.dashboardRecentSessions) }}
            </p>
            <div :class="cn('h-30')">
              <TrendSparkline
                :points="_trendPoints"
                :width="600"
                :height="120"
              />
            </div>
            <div :class="cn('flex', 'flex-wrap', 'justify-between', 'gap-2')">
              <span
                v-for="trendPoint in stats.trend"
                :key="trendPoint.sessionId"
                :class="cn('font-mono', 'text-[0.72rem]', 'text-ink-faint')"
              >
                {{ _formatDate(trendPoint.finishedAt) }} ·
                {{ trendPoint.percentage }}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card v-if="stats.weakest.length > 0">
          <CardContent :class="cn('p-5', 'flex', 'flex-col', 'gap-3')">
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
              {{ i18n.t(TranslationKey.dashboardWeakest) }}
            </p>
            <ul
              :class="
                cn('m-0', 'list-none', 'p-0', 'flex', 'flex-col', 'gap-2')
              "
            >
              <li
                v-for="weakestItem in stats.weakest"
                :key="weakestItem.number"
                :class="
                  cn(
                    'flex',
                    'items-center',
                    'justify-between',
                    'gap-3',
                    'border-t',
                    'border-border',
                    'py-3',
                    'first:border-t-0',
                  )
                "
              >
                <span :class="cn('text-[0.9rem]')"
                  >Q{{ weakestItem.number }} · {{ weakestItem.title }}</span
                >
                <span
                  :class="
                    cn(
                      'flex-none',
                      'font-mono',
                      'text-[0.75rem]',
                      'text-danger',
                    )
                  "
                  >{{
                    i18n.t(TranslationKey.dashboardErrorRate, {
                      rate: Math.round(weakestItem.wrongRate * 100),
                      attempts: weakestItem.attempts,
                    })
                  }}</span
                >
              </li>
            </ul>
          </CardContent>
        </Card>
      </template>
    </main>
  </div>
</template>
