<script setup lang="ts">
import type { DefineProps } from "vue";

interface StatCardProps {
  hint?: string;
  label: string;
  value: string;
}

const _props: DefineProps<StatCardProps, never> = defineProps<StatCardProps>();
</script>

<template>
  <Card
    :class="
      cn('flex', 'flex-col', 'gap-2', 'p-5', 'flex-1', 'basis-40', 'min-w-40')
    "
  >
    <p
      :class="
        cn(
          'font-mono',
          'text-xs',
          'font-medium',
          'uppercase',
          'tracking-wider',
          'text-ink-faint',
        )
      "
    >
      {{ _props.label }}
    </p>
    <p
      :class="
        cn('font-display', 'text-[2rem]', 'font-semibold', 'tracking-tight')
      "
    >
      {{ _props.value }}
    </p>
    <p v-if="_props.hint" :class="cn('text-[0.82rem]', 'text-ink-muted')">
      {{ _props.hint }}
    </p>
  </Card>
</template>
