<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { Separator } from "reka-ui";
import {
  type ComputedRef,
  computed,
  type DefineProps,
  type HTMLAttributes,
} from "vue";
import { cn } from "@/app/lib/cn.ts";

interface SeparatorProps {
  as?: string;
  asChild?: boolean;
  class?: HTMLAttributes["class"];
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
}

const props: DefineProps<SeparatorProps, never> = withDefaults(
  defineProps<SeparatorProps>(),
  {
    decorative: true,
    orientation: "horizontal",
  },
);

/**
 * Reka-ui primitive isn't auto-registered; alias so the template resolves it.
 */
const _Separator: typeof Separator = Separator;

const _delegatedProps: Omit<
  DefineProps<SeparatorProps, never>,
  "class"
> = reactiveOmit(props, "class");

const _class: ComputedRef<string> = computed((): string =>
  cn(
    "shrink-0",
    "bg-border",
    "data-[orientation=horizontal]:h-px",
    "data-[orientation=horizontal]:w-full",
    "data-[orientation=vertical]:w-px",
    "data-[orientation=vertical]:self-stretch",
    props.class,
  ),
);
</script>

<template>
  <Separator v-bind="_delegatedProps" data-slot="separator" :class="_class" />
</template>
