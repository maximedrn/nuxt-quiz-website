<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
}>()
</script>

<template>
  <Card class="flex flex-col gap-2 p-5 flex-1 basis-40 min-w-40">
    <p class="font-mono text-xs font-medium uppercase tracking-wider text-ink-faint">{{ label }}</p>
    <p class="font-display text-[2rem] font-semibold tracking-tight">{{ value }}</p>
    <p v-if="hint" class="text-[0.82rem] text-ink-muted">{{ hint }}</p>
  </Card>
</template>
