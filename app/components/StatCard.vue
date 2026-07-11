<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
}>()
</script>

<template>
  <div class="stat-card card">
    <p class="stat-card__label eyebrow">{{ label }}</p>
    <p class="stat-card__value">{{ value }}</p>
    <p v-if="hint" class="stat-card__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.stat-card {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1 1 160px;
  min-width: 160px;
}

.stat-card__value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.stat-card__hint {
  font-size: 0.82rem;
  color: var(--ink-muted);
}
</style>
