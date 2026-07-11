<script setup lang="ts">
import { highlightSolidity } from '@/app/lib/quiz/highlight-solidity'

const props = defineProps<{
  code: string
}>()

const html = computed(() => highlightSolidity(props.code))
</script>

<template>
  <div class="code-block">
    <div class="code-block__tab">Solidity</div>
    <pre class="code-block__pre"><code v-html="html" /></pre>
  </div>
</template>

<style scoped>
.code-block {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid #262936;
  margin: var(--space-4) 0;
}

.code-block__tab {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: #9296a3;
  background: #1b1e29;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid #262936;
}

.code-block__pre {
  margin: 0;
  padding: var(--space-4);
  background: var(--code-bg);
  color: var(--code-ink);
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.6;
}

.code-block__pre code {
  font-family: var(--font-mono);
}

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
