<script setup lang="ts">
// Applies the persisted light/dark theme to <html> (SSR-safe, no flash).
useTheme()
</script>

<template>
  <div class="page">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
