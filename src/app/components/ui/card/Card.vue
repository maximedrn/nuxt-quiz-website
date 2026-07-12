<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/app/lib/cn.ts";

interface CardProps {
  class?: HTMLAttributes["class"];
  size?: "default" | "sm";
}

const props: Readonly<Omit<CardProps, "size">> & {
  readonly size: "default" | "sm";
} = withDefaults(defineProps<CardProps>(), {
  size: "default",
});

const _class: ComputedRef<string> = computed((): string =>
  cn(
    "ring-foreground/10",
    "bg-card",
    "text-card-foreground",
    "gap-4",
    "overflow-hidden",
    "rounded-xl",
    "py-4",
    "text-sm",
    "ring-1",
    "has-data-[slot=card-footer]:pb-0",
    "has-[>img:first-child]:pt-0",
    "data-[size=sm]:gap-3",
    "data-[size=sm]:py-3",
    "data-[size=sm]:has-data-[slot=card-footer]:pb-0",
    "*:[img:first-child]:rounded-t-xl",
    "*:[img:last-child]:rounded-b-xl",
    "group/card",
    "flex",
    "flex-col",
    props.class,
  ),
);
</script>

<template>
  <div data-slot="card" :data-size="props.size" :class="_class">
    <slot />
  </div>
</template>
