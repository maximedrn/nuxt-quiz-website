<script setup lang="ts">
import type { DefineProps } from "vue";
import { cn } from "@/app/lib/cn.ts";
import {
  AnswerOutcome,
  type ProgressResult,
} from "@/app/lib/quiz/option-state.ts";

interface ProgressChainProps {
  currentIndex: number;
  results: ProgressResult[];
}

const props: DefineProps<ProgressChainProps, never> =
  defineProps<ProgressChainProps>();

/**
 * Utility classes for one segment based on its answered/pending/current state.
 */
const _segmentClass: (index: number) => string = (index: number): string => {
  const base: string = cn(
    "flex-1",
    "h-1.5",
    "rounded-[3px]",
    "border",
    "transition-colors",
  );
  const result: ProgressResult | undefined = props.results[index];
  if (result === AnswerOutcome.correct) {
    return cn(base, "border-success", "bg-success");
  }
  if (result === AnswerOutcome.incorrect) {
    return cn(base, "border-danger", "bg-danger");
  }
  if (index === props.currentIndex) {
    return cn(base, "border-accent", "bg-accent-soft");
  }
  return cn(base, "border-border-strong", "bg-transparent");
};
</script>

<template>
  <div
    :class="cn('flex', 'w-full', 'gap-0.75')"
    role="img"
    :aria-label="`Progression : ${props.currentIndex + 1} sur ${props.results.length}`"
  >
    <span
      v-for="(_, index) in props.results"
      :key="index"
      :class="_segmentClass(index)"
    />
  </div>
</template>
