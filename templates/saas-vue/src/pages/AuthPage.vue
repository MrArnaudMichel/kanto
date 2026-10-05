<script setup lang="ts">
import type { KtAuthSubmitDetail } from 'kanto-ds';
import { useRouter } from 'vue-router';
import { signIn, signUp } from '../auth';
import { APP_NAME } from '../content';

defineProps<{ mode: 'sign-in' | 'sign-up' }>();
const router = useRouter();

function onSubmit(event: CustomEvent<KtAuthSubmitDetail>): void {
  const { mode: sent, values, wait } = event.detail;
  if (sent === 'sign-in') wait(signIn(values).then(() => router.push('/')));
  else if (sent === 'sign-up') wait(signUp(values).then(() => router.push('/welcome')));
  else wait(new Promise((resolve) => setTimeout(resolve, 500)));
}

function onMode(event: CustomEvent<{ mode: string }>): void {
  const next = event.detail.mode;
  if (next === 'sign-in' || next === 'sign-up') void router.push(`/${next}`);
}
</script>

<template>
  <main class="auth">
    <kt-auth-form :mode="mode" @kt-submit="onSubmit" @kt-mode="onMode">
      <a slot="logo" class="app-brand" href="#/">{{ APP_NAME }}</a>
      <p slot="footer" class="auth-note">A demo: any email and password sign in.</p>
    </kt-auth-form>
  </main>
</template>
