<script setup lang="ts">
import { useTheme } from "@/app/composables/useTheme.ts";
import { useTypedI18n } from "@/app/composables/useTypedI18n.ts";
import { TranslationKey } from "@/app/lib/i18n/i18n.keys.ts";

useTheme();
const { t }: { t: (key: TranslationKey) => string } = useTypedI18n();

useHead({
  meta: [
    { content: () => t(TranslationKey.metaDescription), name: "description" },
  ],
  title: () => t(TranslationKey.metaTitle),
});
</script>

<template>
  <div :class="cn('page')">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
