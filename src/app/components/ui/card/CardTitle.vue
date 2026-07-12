<script setup lang="ts">
import { computed, type DefineProps, type HTMLAttributes } from "vue";
import { cn } from "@/app/lib/cn.ts";

interface CardTitleProps {
  class?: HTMLAttributes["class"];
}

const props: DefineProps<CardTitleProps, never> = defineProps<CardTitleProps>();

const _class: ComputedRef<string> = computed((): string =>
  cn(
    "text-base",
    "leading-snug",
    "font-medium",
    "group-data-[size=sm]/card:text-sm",
    "cn-font-heading",
    props.class,
  ),
);
</script>

<template>
  <div data-slot="card-title" :class="_class">
    <slot />
  </div>
</template>
