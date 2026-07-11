<script setup lang="ts">
import type { AnswerLetter } from '@/shared/types'

defineProps<{
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
    class="option"
    :class="`option--${state}`"
    :disabled="disabled"
    @click="$emit('pick')"
  >
    <span class="option__letter">{{ letter }}</span>
    <span class="option__text">{{ text }}</span>
    <span v-if="state === 'correct'" class="option__mark" aria-hidden="true">&check;</span>
    <span v-else-if="state === 'incorrect'" class="option__mark" aria-hidden="true">&cross;</span>
  </button>
</template>

<style scoped>
.option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-raised);
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    background 0.12s ease,
    opacity 0.12s ease;
}

.option:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.option:disabled {
  cursor: default;
}

.option__letter {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-muted);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  width: 1.6rem;
  height: 1.6rem;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.05rem;
}

.option__text {
  flex: 1;
  font-size: 0.95rem;
  padding-top: 0.1rem;
}

.option__mark {
  flex: none;
  font-size: 1rem;
  font-weight: 700;
  padding-top: 0.1rem;
}

.option--correct {
  border-color: var(--success);
  background: var(--success-soft);
}
.option--correct .option__letter {
  border-color: var(--success);
  color: var(--success);
}
.option--correct .option__mark {
  color: var(--success);
}

.option--incorrect {
  border-color: var(--danger);
  background: var(--danger-soft);
}
.option--incorrect .option__letter {
  border-color: var(--danger);
  color: var(--danger);
}
.option--incorrect .option__mark {
  color: var(--danger);
}

.option--muted {
  opacity: 0.5;
}
</style>
