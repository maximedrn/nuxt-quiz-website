<script setup lang="ts">
import { type DefineProps, type Ref, ref, watch } from "vue";
import { useHighlight } from "@/app/lib/quiz/highlighter/highlighter.context.ts";

interface CodeBlockProps {
  code: string;
  lang?: string;
}

const props: DefineProps<CodeBlockProps, never> = defineProps<CodeBlockProps>();

const html: Ref<string> = ref("");

// Shiki is async (it lazy-loads the grammar on first call); recompute on
// every code change. SSR renders an empty `<pre>` shell, hydration fills it.
watch(
  () => props.code,
  async (code: string) => {
    html.value = await useHighlight().highlight(code, props.lang);
  },
  { immediate: true },
);
</script>

<template>
  <div
    :class="
      cn('my-4', 'overflow-hidden', 'rounded-md', 'border', 'border-[#282c34]')
    "
  >
    <div
      v-if="lang"
      :class="
        cn(
          'border-b',
          'border-[#282c34]',
          'bg-[#21252b]',
          'px-4',
          'py-2',
          'font-mono',
          'text-[0.7rem]',
          'tracking-[0.04em]',
          'text-[#9296a3]',
        )
      "
    >
      {{ lang }}
    </div>
    <pre
      :class="
        cn(
          'm-0',
          'overflow-x-auto',
          'bg-[#282c34]',
          'p-4',
          'text-[0.85rem]',
          'leading-relaxed',
          'text-[#abb2bf]',
        )
      "
    ><code v-html="html" :class="cn('font-mono')" /></pre>
  </div>
</template>
