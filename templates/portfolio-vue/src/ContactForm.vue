<script setup lang="ts">
import type { KtButton, KtInput, KtTextarea } from 'kanto-ds';
import { ref, useTemplateRef } from 'vue';
import { sendMessage } from './actions';
import { CONTACT } from './content';
import { validateMessage, type MessageErrors } from './work';

const errors = ref<MessageErrors>({});
const sent = ref(false);
const name = useTemplateRef<KtInput>('name');
const email = useTemplateRef<KtInput>('email');
const message = useTemplateRef<KtTextarea>('message');
const send = useTemplateRef<KtButton>('send');

function onSubmit(): void {
  const values = {
    name: name.value?.value ?? '',
    email: email.value?.value ?? '',
    message: message.value?.value ?? '',
  };
  errors.value = validateMessage(values);
  if (Object.keys(errors.value).length > 0) return;
  void send.value
    ?.run(() => sendMessage(values))
    .then(() => {
      sent.value = true;
    });
}
</script>

<template>
  <kt-alert v-if="sent" class="contact-sent" variant="success" :description="CONTACT.sent" />
  <form v-else class="contact" novalidate @submit.prevent="onSubmit">
    <kt-label-input label="Your name">
      <kt-input ref="name" name="name" autocomplete="name" :error="errors.name ?? ''" />
    </kt-label-input>
    <kt-label-input label="Email">
      <kt-input
        ref="email"
        name="email"
        type="email"
        autocomplete="email"
        :error="errors.email ?? ''"
      />
    </kt-label-input>
    <kt-label-input label="What are you building?">
      <kt-textarea ref="message" name="message" :rows="4" :error="errors.message ?? ''" />
    </kt-label-input>
    <div>
      <kt-button ref="send" type="submit" icon="send" icon-position="right">Send</kt-button>
    </div>
  </form>
</template>
