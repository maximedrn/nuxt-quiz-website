<script setup lang="ts">
/**
 * A row of segments, one per question in the session — read left to right
 * like block confirmations. Filled green/red once answered, outlined while
 * pending, a brighter outline on the segment currently being asked.
 */
const props = defineProps<{
  results: Array<'correct' | 'incorrect' | null>
  currentIndex: number
}>()

const segmentClass = (index: number) => {
  const result = props.results[index]
  if (result === 'correct') return 'is-correct'
  if (result === 'incorrect') return 'is-incorrect'
  if (index === props.currentIndex) return 'is-current'
  return 'is-pending'
}
</script>

<template>
  <div class="chain" role="img" :aria-label="`Progression : ${currentIndex + 1} sur ${results.length}`">
    <span
      v-for="(_, index) in results"
      :key="index"
      class="chain__segment"
      :class="segmentClass(index)"
    />
  </div>
</template>

<style scoped>
.chain {
  display: flex;
  gap: 3px;
  width: 100%;
}

.chain__segment {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid var(--border-strong);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.chain__segment.is-current {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.chain__segment.is-correct {
  border-color: var(--success);
  background: var(--success);
}

.chain__segment.is-incorrect {
  border-color: var(--danger);
  background: var(--danger);
}
</style>
