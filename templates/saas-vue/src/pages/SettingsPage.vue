<script setup lang="ts">
import type { KtButton } from 'kanto-ds';
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { currentSession, signOut, updateSession } from '../auth';
import { saveProfile } from '../data/api';

const router = useRouter();
const session = currentSession();
const name = ref(session?.name ?? '');
const email = ref(session?.email ?? '');
const confirming = ref(false);
const saveButton = useTemplateRef<KtButton>('saveButton');
const notifyButton = useTemplateRef<KtButton>('notifyButton');

function saveTheProfile(): void {
  void saveButton.value?.run(() =>
    saveProfile({ name: name.value, email: email.value }).then(updateSession),
  );
}

function saveNotifications(): void {
  void notifyButton.value?.run(() => new Promise((resolve) => setTimeout(resolve, 400)));
}

function deleteWorkspace(): void {
  signOut();
  void router.push('/sign-in');
}
</script>

<template>
  <kt-page-header
    heading="Settings"
    description="Your profile, what we email you about, and your workspace."
  />
  <div class="settings">
    <kt-settings-section
      heading="Profile"
      description="The name and email on every invoice you send."
    >
      <kt-label-input label="Name">
        <kt-input
          name="name"
          autocomplete="name"
          :value="name"
          @kt-input="name = $event.detail.value"
        />
      </kt-label-input>
      <kt-label-input label="Email">
        <kt-input
          name="email"
          type="email"
          autocomplete="email"
          :value="email"
          @kt-input="email = $event.detail.value"
        />
      </kt-label-input>
      <kt-button ref="saveButton" slot="actions" done-label="Saved" @click="saveTheProfile"
        >Save</kt-button
      >
    </kt-settings-section>
    <kt-settings-section heading="Notifications" description="What we email you about, and when.">
      <kt-toggle checked>Email me when an invoice is paid</kt-toggle>
      <kt-toggle>Email me a weekly summary</kt-toggle>
      <kt-button ref="notifyButton" slot="actions" done-label="Saved" @click="saveNotifications"
        >Save</kt-button
      >
    </kt-settings-section>
    <kt-settings-section
      danger
      heading="Delete workspace"
      description="Every invoice, customer and file in it goes, for good."
    >
      <kt-button slot="actions" variant="delete" @click="confirming = true"
        >Delete workspace</kt-button
      >
    </kt-settings-section>
  </div>
  <kt-confirm-dialog
    :open="confirming"
    heading="Delete this workspace?"
    message="Everything in it goes, for good. This cannot be undone."
    confirm-label="Delete workspace"
    @kt-cancel="confirming = false"
    @kt-confirm="deleteWorkspace"
  />
</template>
