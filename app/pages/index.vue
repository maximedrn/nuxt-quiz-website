<script setup lang="ts">
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
  <div class="page">
    <AppHeader />

    <main class="container dashboard">
      <section class="hero flex-col gap-3">
        <p class="eyebrow">Cyfrin SSCD+ · Core Solidity &amp; EVM Mechanics</p>
        <h1>Entraînement Solidity &amp; EVM</h1>
        <p class="hero__subtitle">
          90 questions à choix multiple issues du guide de certification. Réponds, vérifie, et suis ta
          progression au fil de tes sessions.
        </p>
        <div class="hero__actions flex gap-3">
          <NuxtLink to="/quiz/new" class="btn btn-accent">Nouvelle session</NuxtLink>
          <NuxtLink v-if="hasHistory" to="/history" class="btn btn-ghost">Voir l'historique</NuxtLink>
        </div>
      </section>

      <section v-if="status === 'pending'" class="empty-state card">
        <p>Chargement…</p>
      </section>

      <template v-else-if="stats">
        <section v-if="!hasHistory" class="empty-state card flex-col gap-2">
          <h2>Aucune session pour l'instant</h2>
          <p>
            Lance ta première session d'entraînement pour commencer à suivre ta progression sur les
            {{ stats.totalQuestions }} questions du guide.
          </p>
        </section>

        <template v-else>
          <section class="stats-grid flex flex-wrap gap-4">
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

          <section class="card trend">
            <div class="flex items-center justify-between">
              <p class="eyebrow">Dernières sessions</p>
            </div>
            <div class="trend__chart">
              <TrendSparkline :points="trendPoints" :width="600" :height="120" />
            </div>
            <div class="trend__labels flex justify-between">
              <span v-for="t in stats.trend" :key="t.sessionId" class="trend__label">
                {{ formatDate(t.finishedAt) }} · {{ t.percentage }}%
              </span>
            </div>
          </section>

          <section v-if="stats.weakest.length > 0" class="card weak-list">
            <p class="eyebrow">Questions à retravailler</p>
            <ul class="weak-list__items">
              <li v-for="w in stats.weakest" :key="w.number" class="weak-list__item flex items-center justify-between">
                <span class="weak-list__title">Q{{ w.number }} · {{ w.title }}</span>
                <span class="weak-list__rate">{{ Math.round(w.wrongRate * 100) }}% d'erreurs · {{ w.attempts }} tentative(s)</span>
              </li>
            </ul>
          </section>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  padding-top: var(--space-7);
  padding-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.hero__subtitle {
  color: var(--ink-muted);
  font-size: 1.02rem;
  max-width: 46ch;
}

.hero__actions {
  margin-top: var(--space-2);
}

.empty-state {
  padding: var(--space-6);
}

.empty-state h2 {
  font-size: 1.1rem;
}
.empty-state p {
  color: var(--ink-muted);
}

.trend {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.trend__chart {
  height: 120px;
}

.trend__labels {
  flex-wrap: wrap;
  gap: var(--space-2);
}

.trend__label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-faint);
}

.weak-list {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.weak-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.weak-list__item {
  padding: var(--space-3) 0;
  border-top: 1px solid var(--border);
  gap: var(--space-3);
}
.weak-list__item:first-child {
  border-top: none;
}

.weak-list__title {
  font-size: 0.9rem;
}

.weak-list__rate {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--danger);
  flex: none;
}
</style>
