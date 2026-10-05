<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { currentSession, signOut } from './auth';
import { APP_NAME, NAV, USER_MENU } from './content';

const route = useRoute();
const router = useRouter();
const session = currentSession();
const activeHref = computed(() => `#${route.path}`);

function onSelect(event: CustomEvent<{ id: string }>): void {
  if (event.detail.id === 'sign-out') {
    signOut();
    void router.push('/sign-in');
  } else void router.push('/settings');
}
</script>

<template>
  <kt-app-shell class="app" :label="APP_NAME">
    <div slot="header" class="app-header">
      <a class="app-brand" href="#/">{{ APP_NAME }}</a>
      <kt-user-menu
        :name="session?.name ?? ''"
        :email="session?.email ?? ''"
        :items="USER_MENU"
        @kt-select="onSelect"
      />
    </div>
    <kt-sub-menu-navigation
      slot="sidebar"
      label="Workspace"
      :sections="NAV"
      :active-href="activeHref"
    />
    <div class="page"><RouterView /></div>
  </kt-app-shell>
</template>
