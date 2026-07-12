<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { Label } from "reka-ui";
import {
  type ComputedRef,
  computed,
  type DefineProps,
  type HTMLAttributes,
} from "vue";
import { cn } from "@/app/lib/cn.ts";

interface LabelProps {
  as?: string;
  asChild?: boolean;
  class?: HTMLAttributes["class"];
  for?: string;
}

const props: DefineProps<LabelProps, "asChild"> = defineProps<LabelProps>();

const _delegatedProps: Omit<
  DefineProps<LabelProps, "asChild">,
  "class"
> = reactiveOmit(props, "class");

const _class: ComputedRef<string> = computed((): string =>
  cn(
    "gap-2",
    "text-sm",
    "leading-none",
    "font-medium",
    "group-data-[disabled=true]:opacity-50",
    "peer-disabled:opacity-50",
    "flex",
    "items-center",
    "select-none",
    "group-data-[disabled=true]:pointer-events-none",
    "peer-disabled:cursor-not-allowed",
    props.class,
  ),
);
</script>

<template>
  <Label v-bind="_delegatedProps" data-slot="label" :class="_class">
    <slot />
  </Label>
</template>
