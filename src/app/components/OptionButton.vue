<script setup lang="ts">
import { type ComputedRef, computed, type DefineProps } from "vue";
import { cn } from "@/app/lib/cn.ts";
import { useAnswerLetter } from "@/app/lib/quiz/labeler/labeler.context.ts";
import { OptionButtonState } from "@/app/lib/quiz/option-state.ts";

interface OptionButtonProps {
  disabled: boolean;
  index: number;
  state: OptionButtonState;
  text: string;
}

const props: DefineProps<OptionButtonProps, "disabled"> =
  defineProps<OptionButtonProps>();

defineEmits<{ pick: [] }>();

const _label: ComputedRef<string> = computed((): string =>
  useAnswerLetter().optionLabel(props.index),
);

const _buttonClass: ComputedRef<string> = computed(() =>
  cn(
    "flex",
    "items-start",
    "gap-3",
    "w-full",
    "text-left",
    "px-4",
    "py-3",
    "border",
    "rounded-[var(--radius-md)]",
    "bg-surface",
    "cursor-pointer",
    "transition-all",
    "duration-[120ms]",
    "ease-in-out",
    "disabled:cursor-default",
    props.state === OptionButtonState.default &&
      cn("border-border-strong", "hover:border-accent", "hover:bg-accent-soft"),
    props.state === OptionButtonState.correct &&
      cn("border-success", "bg-success-soft"),
    props.state === OptionButtonState.incorrect &&
      cn("border-danger", "bg-danger-soft"),
    props.state === OptionButtonState.muted &&
      cn("border-border-strong", "opacity-50"),
  ),
);

const _badgeClass: ComputedRef<string> = computed(() =>
  cn(
    "font-mono",
    "text-[0.8rem]",
    "font-semibold",
    "border",
    "rounded-full",
    "w-[1.6rem]",
    "h-[1.6rem]",
    "flex-none",
    "flex",
    "items-center",
    "justify-center",
    "mt-[0.05rem]",
    props.state === OptionButtonState.correct &&
      cn("border-success", "text-success"),
    props.state === OptionButtonState.incorrect &&
      cn("border-danger", "text-danger"),
    props.state !== OptionButtonState.correct &&
      props.state !== OptionButtonState.incorrect &&
      cn("border-border-strong", "text-ink-muted"),
  ),
);
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :class="_buttonClass"
    @click="$emit('pick')"
  >
    <span :class="_badgeClass">{{ _label }}</span>
    <span :class="cn('flex-1', 'text-[0.95rem]', 'pt-[0.1rem]')">{{
      props.text
    }}</span>
    <span
      v-if="props.state === OptionButtonState.correct"
      :class="
        cn('flex-none', 'text-base', 'font-bold', 'pt-[0.1rem]', 'text-success')
      "
      aria-hidden="true"
      >&check;</span
    >
    <span
      v-else-if="props.state === OptionButtonState.incorrect"
      :class="
        cn('flex-none', 'text-base', 'font-bold', 'pt-[0.1rem]', 'text-danger')
      "
      aria-hidden="true"
      >&cross;</span
    >
  </button>
</template>
