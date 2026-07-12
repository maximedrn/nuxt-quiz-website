<script setup lang="ts">
import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'

const { getStats } = useApi()
const { data: stats, status } = await useAsyncData('dashboard-stats', () => getStats())

const hasHistory = computed(() => (stats.value?.completedSessions ?? 0) > 0)

const pct = (n: number | null | undefined) => (n == null ? '—' : `${n}%`)

const trendPoints = computed(() => stats.value?.trend.map((t) => t.percentage) ?? [])

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso))
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />

    <main class="mx-auto w-full max-w-[780px] px-6 pb-16 pt-10 flex flex-col gap-6">
      <section class="flex flex-col gap-3">
        <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Cyfrin SSCD+ · Core Solidity &amp; EVM Mechanics</p>
        <h1>Entraînement Solidity &amp; EVM</h1>
        <p class="text-[1.02rem] text-ink-muted max-w-[46ch]">
          90 questions à choix multiple issues du guide de certification. Réponds, vérifie, et suis ta
          progression au fil de tes sessions.
        </p>
        <div class="flex gap-3 mt-2">
          <Button as-child>
            <NuxtLink to="/quiz/new">Nouvelle session</NuxtLink>
          </Button>
          <Button v-if="hasHistory" variant="outline" as-child>
            <NuxtLink to="/history">Voir l'historique</NuxtLink>
          </Button>
        </div>
      </section>

      <Card v-if="status === 'pending'">
        <CardContent class="p-6">
          <p>Chargement…</p>
        </CardContent>
      </Card>

      <template v-else-if="stats">
        <Card v-if="!hasHistory">
          <CardContent class="p-6 flex flex-col gap-2">
            <h2 class="text-[1.1rem]">Aucune session pour l'instant</h2>
            <p class="text-ink-muted">
              Lance ta première session d'entraînement pour commencer à suivre ta progression sur les
              {{ stats.totalQuestions }} questions du guide.
            </p>
          </CardContent>
        </Card>

        <template v-else>
          <section class="flex flex-wrap gap-4">
            <StatCard label="Sessions complétées" :value="String(stats.completedSessions)" />
            <StatCard label="Score moyen" :value="pct(stats.averageScorePct)" />
            <StatCard label="Meilleur score" :value="pct(stats.bestScorePct)" />
            <StatCard label="Précision globale" :value="pct(stats.overallAccuracyPct)" :hint="`${stats.totalAnswered} réponses`" />
            <StatCard
              label="Série en cours"
              :value="`${stats.currentStreakDays} j`"
              :hint="stats.currentStreakDays > 0 ? 'jour(s) d\'affilée' : 'entraîne-toi aujourd\'hui'"
            />
          </section>

          <Card>
            <CardContent class="p-5 flex flex-col gap-3">
              <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Dernières sessions</p>
              <div class="h-[120px]">
                <TrendSparkline :points="trendPoints" :width="600" :height="120" />
              </div>
              <div class="flex flex-wrap justify-between gap-2">
                <span v-for="t in stats.trend" :key="t.sessionId" class="font-mono text-[0.72rem] text-ink-faint">
                  {{ formatDate(t.finishedAt) }} · {{ t.percentage }}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card v-if="stats.weakest.length > 0">
            <CardContent class="p-5 flex flex-col gap-3">
              <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">Questions à retravailler</p>
              <ul class="m-0 list-none p-0 flex flex-col gap-2">
                <li
                  v-for="w in stats.weakest"
                  :key="w.number"
                  class="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0"
                >
                  <span class="text-[0.9rem]">Q{{ w.number }} · {{ w.title }}</span>
                  <span class="flex-none font-mono text-[0.75rem] text-danger">{{ Math.round(w.wrongRate * 100) }}% d'erreurs · {{ w.attempts }} tentative(s)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </template>
      </template>
    </main>
  </div>
</template>
