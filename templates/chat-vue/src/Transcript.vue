<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue';
import { ASSISTANT, PERSON, SUGGESTIONS } from './content';
import type { Conversation } from './conversations';

const props = defineProps<{ conversation: Conversation | undefined }>();
const emit = defineEmits<{ ask: [text: string] }>();
const box = useTemplateRef<HTMLDivElement>('box');
const pinned = ref(true);

function onScroll(): void {
  const element = box.value;
  if (element) pinned.value = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
}

// The newest message stays in view while a reply streams, unless the reader scrolled up.
watch(
  () => props.conversation,
  async () => {
    await nextTick();
    if (box.value && pinned.value) box.value.scrollTop = box.value.scrollHeight;
  },
  { deep: true, flush: 'post' },
);
</script>

<template>
  <div ref="box" class="transcript" aria-live="polite" @scroll="onScroll">
    <kt-empty-state
      v-if="!conversation || conversation.messages.length === 0"
      icon="sparkles"
      :heading="`Ask ${ASSISTANT.name}`"
      :description="ASSISTANT.tagline"
    >
      <div class="suggestions">
        <kt-button
          v-for="text in SUGGESTIONS"
          :key="text"
          variant="secondary"
          size="small"
          @click="emit('ask', text)"
          >{{ text }}</kt-button
        >
      </div>
    </kt-empty-state>
    <template v-else>
      <kt-chat-message
        v-for="message in conversation.messages"
        :key="message.id"
        :from="message.from"
        :name="message.from === 'user' ? PERSON.name : ASSISTANT.name"
        :thinking="message.from === 'assistant' && message.streaming && message.text === ''"
        :streaming="message.streaming && message.text !== ''"
      >
        <p class="message-text">{{ message.text }}</p>
      </kt-chat-message>
    </template>
  </div>
</template>
