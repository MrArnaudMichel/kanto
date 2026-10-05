<script setup lang="ts">
/** The rendered page: nodes built by the shared renderer, mounted as they are. */
import { onMounted, useTemplateRef, watch } from 'vue';
import { renderMarkdown } from './markdown';

const props = defineProps<{ source: string }>();
const box = useTemplateRef<HTMLElement>('box');
const draw = () => box.value?.replaceChildren(...renderMarkdown(props.source));
onMounted(draw);
watch(() => props.source, draw);
</script>

<template>
  <article ref="box" class="preview" aria-label="Preview" />
</template>
