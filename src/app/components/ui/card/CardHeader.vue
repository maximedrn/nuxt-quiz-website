<script setup lang="ts">
import { computed, type DefineProps, type HTMLAttributes } from "vue";
import { cn } from "@/app/lib/cn.ts";

interface CardHeaderProps {
  class?: HTMLAttributes["class"];
}

const props: DefineProps<CardHeaderProps, never> =
  defineProps<CardHeaderProps>();

const _class: ComputedRef<string> = computed((): string =>
  cn(
    "gap-1",
    "rounded-t-xl",
    "px-4",
    "group-data-[size=sm]/card:px-3",
    "[.border-b]:pb-4",
    "group-data-[size=sm]/card:[.border-b]:pb-3",
    "group/card-header",
    "@container/card-header",
    "grid",
    "auto-rows-min",
    "items-start",
    "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
    "has-data-[slot=card-description]:grid-rows-[auto_auto]",
    props.class,
  ),
);
</script>

<template>
  <div data-slot="card-header" :class="_class">
    <slot />
  </div>
</template>
