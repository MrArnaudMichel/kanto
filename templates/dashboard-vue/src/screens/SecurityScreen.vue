<script setup lang="ts">
/** Your password, two-factor authentication, and where you are signed in. */
import { toaster, type KtInput } from 'kanto-ds';
import { onBeforeUnmount, reactive, ref, shallowRef, useTemplateRef } from 'vue';
import { listSessions, revokeSession, type Session } from '../data/api';

/** How far a password is from good enough, out of 100: length, then variety. */
function strength(password: string): number {
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password));
  return Math.min(100, password.length * 5 + kinds.length * 10);
}

const current = useTemplateRef<KtInput>('current');
const next = useTemplateRef<KtInput>('next');
const errors = reactive({ current: '', next: '' });
const score = ref(0);
const sessions = shallowRef<readonly Session[]>([]);
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listSessions().then((loaded) => {
  if (live) sessions.value = loaded;
});

function update(): void {
  errors.current = current.value?.value ? '' : 'Enter your current password.';
  errors.next = (next.value?.value.length ?? 0) >= 12 ? '' : 'Use at least 12 characters.';
  if (errors.current || errors.next) return;
  if (current.value) current.value.value = '';
  if (next.value) next.value.value = '';
  score.value = 0;
  toaster.success('Password updated');
}

function signOut(session: Session): void {
  void revokeSession(session.id).then(async () => {
    sessions.value = await listSessions();
    toaster.success(`${session.device} signed out`);
  });
}
</script>

<template>
  <div class="screen screen-security">
    <kt-page-header
      eyebrow="Settings"
      heading="Security"
      description="Your password, two-factor authentication, and where you are signed in."
    />
    <div class="settings-narrow">
      <form novalidate @submit.prevent="update">
        <kt-form heading="Password">
          <kt-label-input label="Current password" required>
            <kt-input
              ref="current"
              type="password"
              name="current"
              autocomplete="current-password"
              :error="errors.current"
            />
          </kt-label-input>
          <kt-label-input label="New password" required>
            <kt-input
              ref="next"
              type="password"
              name="next"
              autocomplete="new-password"
              placeholder="At least 12 characters"
              :error="errors.next"
              @kt-input="
                (event: CustomEvent<{ value: string }>) => (score = strength(event.detail.value))
              "
            />
          </kt-label-input>
          <kt-progress-bar
            :value="score"
            variant="success"
            size="small"
            label="Password strength"
          />
          <kt-button slot="footer" type="submit">Update password</kt-button>
        </kt-form>
      </form>

      <kt-form heading="Two-factor authentication">
        <kt-alert
          variant="success"
          heading="On"
          description="With an authenticator app since 14 June 2026."
        >
          <kt-button
            slot="actions"
            size="small"
            variant="dark"
            @click="toaster.info('Recovery codes come from your auth provider.')"
          >
            View recovery codes
          </kt-button>
        </kt-alert>
      </kt-form>

      <kt-form heading="Sessions" description="Devices signed in to your account.">
        <div class="stack">
          <div v-for="session in sessions" :key="session.id" class="setting-row">
            <div class="stack tight">
              <span class="row">
                {{ session.device }}
                <kt-badge v-if="session.current" tone="success" size="small">This device</kt-badge>
              </span>
              <span class="muted small">{{ session.where }}</span>
            </div>
            <kt-button
              v-if="!session.current"
              size="small"
              variant="danger"
              @click="signOut(session)"
            >
              Sign out
            </kt-button>
          </div>
        </div>
      </kt-form>
    </div>
  </div>
</template>
