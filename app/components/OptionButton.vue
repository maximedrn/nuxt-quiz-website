<script setup lang="ts">
import { cn } from '@/app/lib/cn'
import type { AnswerLetter } from '@/shared/types'

const props = defineProps<{
  letter: AnswerLetter
  text: string
  state: 'default' | 'correct' | 'incorrect' | 'muted'
  disabled: boolean
}>()

defineEmits<{ pick: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="cn(
      'flex',
      'items-start',
      'gap-3',
      'w-full',
      'text-left',
      'px-4',
      'py-3',
      'border',
      'rounded-[var(--radius-md)]',
      'bg-surface',
      'cursor-pointer',
      'transition-all',
      'duration-[120ms]',
      'ease-in-out',
      'disabled:cursor-default',
      props.state === 'default' && 'border-border-strong hover:border-accent hover:bg-accent-soft',
      props.state === 'correct' && 'border-success bg-success-soft',
      props.state === 'incorrect' && 'border-danger bg-danger-soft',
      props.state === 'muted' && 'border-border-strong opacity-50',
    )"
    @click="$emit('pick')"
  >
    <span
      :class="cn(
        'font-mono',
        'text-[0.8rem]',
        'font-semibold',
        'border',
        'rounded-full',
        'w-[1.6rem]',
        'h-[1.6rem]',
        'flex-none',
        'flex',
        'items-center',
        'justify-center',
        'mt-[0.05rem]',
        props.state === 'correct' ? 'border-success text-success' : '',
        props.state === 'incorrect' ? 'border-danger text-danger' : '',
        props.state !== 'correct' && props.state !== 'incorrect' ? 'border-border-strong text-ink-muted' : '',
      )"
    >{{ letter }}</span>
    <span class="flex-1 text-[0.95rem] pt-[0.1rem]">{{ text }}</span>
    <span
      v-if="state === 'correct'"
      class="flex-none text-base font-bold pt-[0.1rem] text-success"
      aria-hidden="true"
    >&check;</span>
    <span
      v-else-if="state === 'incorrect'"
      class="flex-none text-base font-bold pt-[0.1rem] text-danger"
      aria-hidden="true"
    >&cross;</span>
  </button>
</template>
