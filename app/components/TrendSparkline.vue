<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    points: number[]
    width?: number
    height?: number
  }>(),
  { width: 100, height: 100 },
)

const pad = 6

const coords = computed(() => {
  const n = props.points.length
  if (n === 0) return []
  const w = props.width - pad * 2
  const h = props.height - pad * 2
  return props.points.map((pct, i) => {
    const x = n === 1 ? props.width / 2 : pad + (i / (n - 1)) * w
    const y = pad + h - (pct / 100) * h
    return { x, y, pct }
  })
})

const pathD = computed(() =>
  coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' '),
)
</script>

<template>
  <svg
    v-if="coords.length > 0"
    class="sparkline"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    role="img"
    aria-label="Évolution du score sur les dernières sessions"
  >
    <path :d="pathD" class="sparkline__line" fill="none" />
    <circle
      v-for="(c, i) in coords"
      :key="i"
      :cx="c.x"
      :cy="c.y"
      :r="i === coords.length - 1 ? 3.5 : 2"
      class="sparkline__dot"
      :class="{ 'is-last': i === coords.length - 1 }"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.sparkline__line {
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sparkline__dot {
  fill: var(--bg-raised);
  stroke: var(--accent);
  stroke-width: 1.5;
}

.sparkline__dot.is-last {
  fill: var(--accent);
}
</style>
