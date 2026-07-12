<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { Primitive } from "reka-ui";
import {
  type ComputedRef,
  computed,
  type DefineProps,
  type HTMLAttributes,
} from "vue";
import {
  type BadgeVariants,
  badgeVariants,
} from "@/app/components/ui/badge/index.ts";
import { cn } from "@/app/lib/cn.ts";

interface BadgeProps {
  as?: string;
  asChild?: boolean;
  class?: HTMLAttributes["class"];
  variant?: BadgeVariants["variant"];
}

const props: DefineProps<BadgeProps, "asChild"> = defineProps<BadgeProps>();

const _delegatedProps: Omit<
  DefineProps<BadgeProps, "asChild">,
  "class"
> = reactiveOmit(props, "class");

const _class: ComputedRef<string> = computed((): string =>
  cn(badgeVariants({ variant: props.variant }), props.class),
);
</script>

<template>
  <Primitive
    v-bind="_delegatedProps"
    data-slot="badge"
    :data-variant="props.variant"
    :class="_class"
  >
    <slot />
  </Primitive>
</template>
