<script setup lang="ts">
import type { CareerStep } from './content';

defineProps<{ steps: readonly CareerStep[] }>();
</script>

<template>
  <kt-timeline>
    <kt-timeline-item
      v-for="step in steps"
      :key="step.heading"
      :heading="step.heading"
      :time="step.time"
      :icon="step.icon"
      :variant="step.variant"
      >{{ step.body }}</kt-timeline-item
    >
  </kt-timeline>
</template>
