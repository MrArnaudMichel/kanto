<script setup lang="ts">
import { computed } from 'vue';
import Timeline from './Timeline.vue';
import { projectBySlug } from './work';

const props = defineProps<{ slug: string | null }>();
const emit = defineEmits<{ close: [] }>();
const project = computed(() => (props.slug ? projectBySlug(props.slug) : undefined));

function visit(): void {
  if (project.value) window.open(project.value.url, '_blank', 'noopener');
}
</script>

<template>
  <kt-side-panel
    :open="project !== undefined"
    :eyebrow="project ? `${project.year} · ${project.role}` : ''"
    :heading="project?.name ?? ''"
    @kt-close="emit('close')"
  >
    <template v-if="project">
      <p>{{ project.summary }}</p>
      <div class="outcomes">
        <div v-for="outcome in project.outcomes" :key="outcome.label" class="outcome">
          <strong>{{ outcome.value }}</strong>
          <span>{{ outcome.label }}</span>
          <kt-badge v-if="outcome.delta" variant="count" tone="success">{{
            outcome.delta
          }}</kt-badge>
        </div>
      </div>
      <Timeline :steps="project.phases" />
      <div class="tags">
        <kt-badge v-for="tag in project.tags" :key="tag" :label="tag" />
      </div>
      <kt-button slot="footer" @click="visit">Visit the site</kt-button>
    </template>
  </kt-side-panel>
</template>
