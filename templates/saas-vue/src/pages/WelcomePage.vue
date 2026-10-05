<script setup lang="ts">
import { useRouter } from 'vue-router';
import { currentSession, markWelcomed } from '../auth';
import { APP_NAME, FIRST_STEPS } from '../content';

const router = useRouter();
const heading = `Welcome, ${currentSession()?.name ?? 'there'}`;
const lead = `A few steps and ${APP_NAME} is ready to send invoices.`;

function onStep(event: CustomEvent<{ id: string }>): void {
  if (event.detail.id === 'overview') {
    markWelcomed();
    void router.push('/');
  }
}
</script>

<template>
  <kt-empty-page :heading="heading" :lead="lead" :steps="FIRST_STEPS" @kt-step="onStep">
    <a slot="actions" href="#/" @click="markWelcomed()">Skip for now</a>
  </kt-empty-page>
</template>
