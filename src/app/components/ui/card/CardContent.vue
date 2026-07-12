<script setup lang="ts">
import { computed, type DefineProps, type HTMLAttributes } from "vue";
import { cn } from "@/app/lib/cn.ts";

interface CardContentProps {
  class?: HTMLAttributes["class"];
}

const props: DefineProps<CardContentProps, never> =
  defineProps<CardContentProps>();

const _class: ComputedRef<string> = computed((): string =>
  cn("px-4", "group-data-[size=sm]/card:px-3", props.class),
);
</script>

<template>
  <div data-slot="card-content" :class="_class">
    <slot />
  </div>
</template>
