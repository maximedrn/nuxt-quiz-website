<script setup lang="ts">
import { computed, type DefineProps, type HTMLAttributes } from "vue";
import { cn } from "@/app/lib/cn.ts";

interface CardFooterProps {
  class?: HTMLAttributes["class"];
}

const props: DefineProps<CardFooterProps, never> =
  defineProps<CardFooterProps>();

const _class: ComputedRef<string> = computed((): string =>
  cn(
    "bg-muted/50",
    "rounded-b-xl",
    "border-t",
    "p-4",
    "group-data-[size=sm]/card:p-3",
    "flex",
    "items-center",
    props.class,
  ),
);
</script>

<template>
  <div data-slot="card-footer" :class="_class">
    <slot />
  </div>
</template>
