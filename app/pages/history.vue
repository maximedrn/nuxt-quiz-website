<script setup lang="ts">
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'

const { listSessions } = useApi()
const { data: sessions, status } = await useAsyncData('history-sessions', () => listSessions())

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const modeLabel = (mode: string) => (mode === 'sequential' ? "Dans l'ordre" : 'Aléatoire')
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <main class="mx-auto w-full max-w-[780px] px-6 pb-16 pt-8 flex flex-col gap-5">
      <h1>Historique</h1>

      <p v-if="status === 'pending'" class="text-ink-muted">Chargement…</p>

      <p v-else-if="!sessions || sessions.length === 0" class="text-ink-muted">
        Aucune session pour l'instant.
        <NuxtLink to="/quiz/new">Lance ta première session</NuxtLink>.
      </p>

      <ul v-else class="m-0 list-none p-0 flex flex-col gap-3">
        <li v-for="s in sessions" :key="s.id">
          <Card>
            <CardContent class="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div class="flex flex-col gap-1">
                <p class="text-[0.92rem] font-medium">{{ formatDate(s.startedAt) }}</p>
                <p class="font-mono text-[0.72rem] font-medium uppercase tracking-wider text-ink-faint">{{ modeLabel(s.mode) }} · {{ s.total }} questions</p>
              </div>

              <div class="flex items-center gap-4">
                <span v-if="s.status === 'completed'" class="font-mono text-[0.85rem]">
                  {{ s.score }}/{{ s.total }} · {{ Math.round(((s.score ?? 0) / s.total) * 100) }}%
                </span>
                <span v-else class="font-mono text-[0.85rem] text-ink-muted">{{ s.answered }}/{{ s.total }} répondues</span>

                <Button variant="outline" size="sm" as-child>
                  <NuxtLink :to="s.status === 'completed' ? `/quiz/${s.id}/results` : `/quiz/${s.id}`">
                    {{ s.status === 'completed' ? 'Revoir' : 'Reprendre' }}
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
