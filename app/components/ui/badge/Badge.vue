<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/app/lib/cn'
import type { BadgeVariants } from '.'
import { badgeVariants } from '.'

const props = defineProps<{
  as?: string
  asChild?: boolean
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <Primitive
    data-slot="badge"
    :data-variant="variant"
    :class="cn(badgeVariants({ variant }), props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </Primitive>
</template>
