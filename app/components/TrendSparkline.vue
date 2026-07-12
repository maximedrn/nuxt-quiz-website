<script setup lang="ts">
import { cn } from '@/app/lib/cn'

const props = withDefaults(
  defineProps<{
    points: number[]
    width?: number
    height?: number
  }>(),
  { width: 100, height: 100 },
)

const pad = 6

const coords = computed((): Array<{ x: number; y: number; pct: number }> => {
  const n: number = props.points.length
  if (n === 0) return []
  const w: number = props.width - pad * 2
  const h: number = props.height - pad * 2
  return props.points.map((pct: number, i: number) => {
    const x: number = n === 1 ? props.width / 2 : pad + (i / (n - 1)) * w
    const y: number = pad + h - (pct / 100) * h
    return { x, y, pct }
  })
})

const pathD = computed((): string =>
  coords.value.map((c, i: number) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' '),
)

/** Fill class for a dot — the last point is emphasized. */
const dotClass = (isLast: boolean): string =>
  cn('stroke-accent', 'stroke-[1.5]', isLast ? 'fill-accent' : 'fill-surface')
</script>

<template>
  <svg
    v-if="coords.length > 0"
    class="h-full w-full overflow-visible"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    role="img"
    aria-label="Évolution du score sur les dernières sessions"
  >
    <path
      :d="pathD"
      fill="none"
      class="stroke-accent stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
    />
    <circle
      v-for="(c, i) in coords"
      :key="i"
      :cx="c.x"
      :cy="c.y"
      :r="i === coords.length - 1 ? 3.5 : 2"
      :class="dotClass(i === coords.length - 1)"
    />
  </svg>
</template>
