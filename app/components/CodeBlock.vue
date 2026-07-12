<script setup lang="ts">
import { highlightSolidity } from '@/app/lib/quiz/highlight-solidity'

const props = defineProps<{
  code: string
}>()

const html = computed(() => highlightSolidity(props.code))
</script>

<template>
  <div class="my-4 overflow-hidden rounded-[var(--radius-md)] border border-[#262936]">
    <div class="border-b border-[#262936] bg-[#1b1e29] px-4 py-2 font-mono text-[0.7rem] tracking-[0.04em] text-[#9296a3]">
      Solidity
    </div>
    <pre class="m-0 overflow-x-auto bg-[var(--code-bg)] p-4 text-[0.85rem] leading-relaxed text-[var(--code-ink)]"><code v-html="html" class="font-mono" /></pre>
  </div>
</template>

<style scoped>
/* ponytail: :deep() pseudo-selectors targeting v-html tok-* tokens can't be expressed as Tailwind utilities */
:deep(.tok-kw) {
  color: #c792ea;
}
:deep(.tok-type) {
  color: #82aaff;
}
:deep(.tok-str) {
  color: #c3e88d;
}
:deep(.tok-com) {
  color: #6b7280;
  font-style: italic;
}
:deep(.tok-num) {
  color: #f78c6c;
}
</style>
