<script setup lang="ts">
import type { KtAppShell } from 'kanto-ds';
import { computed, ref, useTemplateRef } from 'vue';
import { ASSISTANT, SEED } from './content';
import {
  addQuestion,
  appendToken,
  finishReply,
  newConversation,
  type Conversation,
} from './conversations';
import { reply } from './model';
import Transcript from './Transcript.vue';

const started = location.hash === '#new' ? newConversation(SEED) : null;
const list = ref<Conversation[]>(started ? started.list : [...SEED]);
const open = ref(started ? started.id : SEED[0]!.id);
const shell = useTemplateRef<KtAppShell>('shell');
const current = computed(() => list.value.find((conversation) => conversation.id === open.value));

function choose(id: number): void {
  open.value = id;
  // On a phone the list is a drawer: choosing from it closes it.
  if (shell.value) shell.value.sidebarOpen = false;
}

function startNew(): void {
  const next = newConversation(list.value);
  list.value = next.list;
  choose(next.id);
}

/** Sends a question in the open conversation; resolves once the reply has streamed. */
async function ask(text: string): Promise<void> {
  const id = open.value;
  const asked = addQuestion(list.value, id, text);
  if (!asked) return;
  list.value = asked.list;
  // `id` is the conversation asked in: the reply lands there, whichever is open.
  await reply(text, (token) => {
    list.value = appendToken(list.value, id, asked.replyId, token);
  });
  list.value = finishReply(list.value, id, asked.replyId);
}

function onSubmit(
  event: CustomEvent<{ value: string; wait: (promise: Promise<unknown>) => void }>,
): void {
  event.detail.wait(ask(event.detail.value));
}
</script>

<template>
  <kt-app-shell ref="shell" class="app" :label="ASSISTANT.name">
    <div slot="header" class="app-header">
      <span class="app-title">{{ current?.title ?? '' }}</span>
    </div>
    <div slot="sidebar" class="side">
      <kt-button class="new-chat" icon="square-pen" variant="secondary" @click="startNew"
        >New chat</kt-button
      >
      <ul class="conversations" aria-label="Conversations">
        <li v-for="conversation in list" :key="conversation.id">
          <button
            type="button"
            class="conversation"
            :aria-current="conversation.id === open ? 'true' : undefined"
            @click="choose(conversation.id)"
          >
            {{ conversation.title }}
          </button>
        </li>
      </ul>
    </div>
    <div class="chat">
      <Transcript :conversation="current" @ask="(text) => void ask(text)" />
      <div class="composer">
        <kt-prompt-input
          :label="`Ask ${ASSISTANT.name}`"
          placeholder="Ask about your numbers…"
          @kt-submit="onSubmit"
        />
      </div>
    </div>
  </kt-app-shell>
</template>
