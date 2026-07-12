<script setup lang="ts">
import { computed, type DefineProps, type HTMLAttributes } from "vue";
import { cn } from "@/app/lib/cn.ts";

interface CardDescriptionProps {
  class?: HTMLAttributes["class"];
}

const props: DefineProps<CardDescriptionProps, never> =
  defineProps<CardDescriptionProps>();

const _class: ComputedRef<string> = computed((): string =>
  cn("text-muted-foreground", "text-sm", props.class),
);
</script>

<template>
  <div data-slot="card-description" :class="_class">
    <slot />
  </div>
</template>
