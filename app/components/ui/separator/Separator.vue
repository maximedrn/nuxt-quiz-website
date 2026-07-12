<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { Separator } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/app/lib/cn'

const props = withDefaults(
  defineProps<{
    as?: string
    asChild?: boolean
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
    class?: HTMLAttributes['class']
  }>(),
  {
    orientation: 'horizontal',
    decorative: true,
  },
)

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <Separator
    data-slot="separator"
    v-bind="delegatedProps"
    :class="
      cn(
        'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
        props.class,
      )
    "
  />
</template>
