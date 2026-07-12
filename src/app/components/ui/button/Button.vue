<script setup lang="ts">
import { type AsTag, Primitive, type PrimitiveProps } from "reka-ui";
import { type ComputedRef, computed, type HTMLAttributes } from "vue";
import {
  type ButtonVariants,
  buttonVariants,
} from "@/app/components/ui/button/index.ts";
import { cn } from "@/app/lib/cn.ts";

interface ButtonProps {
  as?: PrimitiveProps["as"];
  asChild?: boolean;
  class?: HTMLAttributes["class"];
  size?: ButtonVariants["size"];
  variant?: ButtonVariants["variant"];
}

const props: Readonly<Omit<ButtonProps, "as">> & {
  readonly as: AsTag | globalThis.Component;
} & {
  readonly asChild: boolean;
} = withDefaults(defineProps<ButtonProps>(), {
  as: "button",
});

const _class: ComputedRef<string> = computed((): string =>
  cn(buttonVariants({ size: props.size, variant: props.variant }), props.class),
);
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="props.variant"
    :data-size="props.size"
    :as="props.as"
    :as-child="props.asChild"
    :class="_class"
  >
    <slot />
  </Primitive>
</template>
