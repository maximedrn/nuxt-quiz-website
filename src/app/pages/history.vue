<script setup lang="ts">
import { useAsyncData } from "nuxt/app";
import { type QuizApi, useApi } from "@/app/composables/useApi.ts";
import {
  type TypedI18n,
  useTypedI18n,
} from "@/app/composables/useTypedI18n.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";
import type { SessionSummary } from "@/app/lib/quiz/quiz.types.ts";
import {
  SessionMode,
  SessionStatus,
} from "@/app/lib/storage/storage.constants.ts";

const i18n: TypedI18n = useTypedI18n();

const api: QuizApi = useApi();
const listSessions: () => Promise<SessionSummary[]> = api.listSessions;
const { data: _sessions, status: _status } = await useAsyncData(
  "history-sessions",
  (): Promise<SessionSummary[]> => listSessions(),
);

const _formatDate: (iso: string) => string = (iso: string): string =>
  new Intl.DateTimeFormat(i18n.locale.value, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

/**
 * Label for a session mode, from the typed key.
 */
const _modeLabel: (mode: string) => string = (mode: string): string => {
  if (mode === SessionMode.sequential) {
    return i18n.t(TranslationKey.modeSequential);
  }
  return i18n.t(TranslationKey.modeRandom);
};
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
          'pt-8',
          'flex',
          'flex-col',
          'gap-5',
        )
      "
    >
      <h1>{{ i18n.t(TranslationKey.navHistory) }}</h1>

      <p v-if="_status === 'pending'" :class="cn('text-ink-muted')">
        {{ i18n.t(TranslationKey.commonLoading) }}
      </p>

      <p
        v-else-if="!_sessions || _sessions.length === 0"
        :class="cn('text-ink-muted')"
      >
        {{ i18n.t(TranslationKey.historyEmpty) }}
        <NuxtLink to="/quiz/new">{{
          i18n.t(TranslationKey.historyStartFirst)
        }}</NuxtLink
        >.
      </p>

      <ul
        v-else
        :class="cn('m-0', 'list-none', 'p-0', 'flex', 'flex-col', 'gap-3')"
      >
        <li v-for="session in _sessions" :key="session.id">
          <Card>
            <CardContent
              :class="
                cn(
                  'flex',
                  'flex-wrap',
                  'items-center',
                  'justify-between',
                  'gap-4',
                  'px-5',
                  'py-4',
                )
              "
            >
              <div :class="cn('flex', 'flex-col', 'gap-1')">
                <p :class="cn('text-[0.92rem]', 'font-medium')">
                  {{ _formatDate(session.startedAt) }}
                </p>
                <p
                  :class="
                    cn(
                      'font-mono',
                      'text-[0.72rem]',
                      'font-medium',
                      'uppercase',
                      'tracking-wider',
                      'text-ink-faint',
                    )
                  "
                >
                  {{ _modeLabel(session.mode) }} ·
                  {{
                    i18n.t(TranslationKey.historyQuestions, {
                      count: session.total,
                    })
                  }}
                </p>
              </div>

              <div :class="cn('flex', 'items-center', 'gap-4')">
                <span
                  v-if="session.status === SessionStatus.completed"
                  :class="cn('font-mono', 'text-[0.85rem]')"
                >
                  {{ session.score }}/{{ session.total }} ·
                  {{
                    Math.round(((session.score ?? 0) / session.total) * 100)
                  }}%
                </span>
                <span
                  v-else
                  :class="cn('font-mono', 'text-[0.85rem]', 'text-ink-muted')"
                  >{{
                    i18n.t(TranslationKey.historyAnswered, {
                      answered: session.answered,
                      total: session.total,
                    })
                  }}</span
                >

                <Button variant="outline" size="sm" as-child>
                  <NuxtLink
                    :to="
                      session.status === SessionStatus.completed
                        ? `/quiz/${session.id}/results`
                        : `/quiz/${session.id}`
                    "
                  >
                    {{
                      session.status === SessionStatus.completed
                        ? i18n.t(TranslationKey.historyReview)
                        : i18n.t(TranslationKey.historyResume)
                    }}
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      </ul>
    </main>
  </div>
</template>
