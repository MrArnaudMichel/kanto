<script setup lang="ts">
import { KIND_LABEL, KIND_TONE, type Release } from './releases';

defineProps<{ release: Release }>();
</script>

<template>
  <ul class="changes">
    <li v-for="change in release.changes" :key="change.text" class="change">
      <span>
        <kt-badge :tone="KIND_TONE[change.kind]" size="small">{{
          KIND_LABEL[change.kind]
        }}</kt-badge>
      </span>
      <span>{{ change.text }}</span>
    </li>
  </ul>
</template>
