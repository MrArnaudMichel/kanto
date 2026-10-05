<script setup lang="ts">
/** A section's header inside a page, with a link on the right. */
defineProps<{ heading: string; link?: { label: string; href: string } }>();
</script>

<template>
  <kt-page-header level="section" :heading="heading">
    <a v-if="link" slot="actions" :href="link.href">{{ link.label }}</a>
  </kt-page-header>
</template>
