<script setup lang="ts">
import { cn } from '@/app/lib/cn'

/**
 * A row of segments, one per question in the session — read left to right
 * like block confirmations. Filled green/red once answered, outlined while
 * pending, a brighter outline on the segment currently being asked.
 */
const props = defineProps<{
  results: Array<'correct' | 'incorrect' | null>
  currentIndex: number
}>()

/** Utility classes for one segment based on its answered/pending/current state. */
const segmentClass = (index: number): string => {
  const base: string = cn('flex-1', 'h-1.5', 'rounded-[3px]', 'border', 'transition-colors')
  const result: 'correct' | 'incorrect' | null | undefined = props.results[index]
  if (result === 'correct') return cn(base, 'border-success', 'bg-success')
  if (result === 'incorrect') return cn(base, 'border-danger', 'bg-danger')
  if (index === props.currentIndex) return cn(base, 'border-accent', 'bg-accent-soft')
  return cn(base, 'border-border-strong', 'bg-transparent')
}
</script>

<template>
  <div
    class="flex w-full gap-[3px]"
    role="img"
    :aria-label="`Progression : ${currentIndex + 1} sur ${results.length}`"
  >
    <span v-for="(_, index) in results" :key="index" :class="segmentClass(index)" />
  </div>
</template>
