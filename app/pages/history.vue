<script setup lang="ts">
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
  <div class="page">
    <AppHeader />

    <main class="container history">
      <h1>Historique</h1>

      <p v-if="status === 'pending'" class="history__empty">Chargement…</p>

      <p v-else-if="!sessions || sessions.length === 0" class="history__empty">
        Aucune session pour l'instant.
        <NuxtLink to="/quiz/new">Lance ta première session</NuxtLink>.
      </p>

      <ul v-else class="history__list">
        <li v-for="s in sessions" :key="s.id" class="history__row card flex items-center justify-between gap-4">
          <div class="flex-col gap-1">
            <p class="history__date">{{ formatDate(s.startedAt) }}</p>
            <p class="history__meta eyebrow">{{ modeLabel(s.mode) }} · {{ s.total }} questions</p>
          </div>

          <div class="flex items-center gap-4">
            <span v-if="s.status === 'completed'" class="history__score">
              {{ s.score }}/{{ s.total }} · {{ Math.round(((s.score ?? 0) / s.total) * 100) }}%
            </span>
            <span v-else class="history__pending">{{ s.answered }}/{{ s.total }} répondues</span>

            <NuxtLink
              :to="s.status === 'completed' ? `/quiz/${s.id}/results` : `/quiz/${s.id}`"
              class="btn btn-ghost history__action"
            >
              {{ s.status === 'completed' ? 'Revoir' : 'Reprendre' }}
            </NuxtLink>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.history {
  padding-top: var(--space-6);
  padding-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.history__empty {
  color: var(--ink-muted);
}

.history__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.history__row {
  padding: var(--space-4) var(--space-5);
  flex-wrap: wrap;
}

.history__date {
  font-size: 0.92rem;
  font-weight: 500;
}

.history__meta {
  font-size: 0.72rem;
}

.history__score {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.history__pending {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--ink-muted);
}

.history__action {
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
}
</style>
