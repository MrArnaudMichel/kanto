<script setup lang="ts">
/**
 * The console's frame: the sidebar, the top bar, Cmd+K and the cookie notice.
 * Screens render in its RouterView.
 */
import { toaster, type KtCommandPalette } from 'kanto-ds';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PERSON, STORAGE, WORKSPACE } from './data/fixtures';
import { loadMail, mail } from './mail';
import { COMMANDS, hrefFor, navWithUnread, titleFor } from './nav';
import { unreadCount } from './views';

const COOKIES_KEY = 'northwind-console-cookies';

function cookiesAnswered(): boolean {
  try {
    return localStorage.getItem(COOKIES_KEY) !== null;
  } catch {
    return false;
  }
}

const ACCOUNT_MENU = [
  { id: 'people', label: 'Members' },
  { id: 'security', label: 'Security' },
  { id: 'out', label: 'Sign out' },
];

const route = useRoute();
const router = useRouter();
const palette = useTemplateRef<KtCommandPalette>('palette');
const collapsed = ref(false);
const drawer = ref(false);
const cookies = ref(cookiesAnswered());

loadMail();
const unread = computed(() => (mail.value ? unreadCount(mail.value) : 0));
const sections = computed(() => navWithUnread(unread.value));
const storagePercent = Math.round((STORAGE.used / STORAGE.total) * 100);

// A new screen: its title, and the drawer closed.
watch(
  () => route.path,
  (path) => {
    document.title = `${titleFor(path)} — Northwind`;
    drawer.value = false;
  },
  { immediate: true },
);

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') drawer.value = false;
};
onMounted(() => document.addEventListener('keydown', closeOnEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', closeOnEscape));

function openPalette(): void {
  if (palette.value) palette.value.open = true;
}

function onAccount(event: CustomEvent<{ value: string }>): void {
  const { value } = event.detail;
  if (value === 'people') void router.push('/settings/members/people');
  else if (value === 'security') void router.push('/settings/security');
  else toaster.info('Signing out goes to your auth provider: see src/Shell.vue.');
}

function answer(choice: string): void {
  try {
    localStorage.setItem(COOKIES_KEY, choice);
  } catch {
    // Private browsing: asked again next visit.
  }
  cookies.value = true;
}
</script>

<template>
  <div class="app" :class="{ collapsed, 'nav-open': drawer }">
    <aside class="app-sidebar">
      <a class="brand" :href="hrefFor('/')">
        <span class="brand-mark"><kt-icon name="layers" :size="18" /></span>
        <span class="brand-copy">
          <span class="brand-name">{{ WORKSPACE.name }}</span>
          <span class="brand-sub">{{ WORKSPACE.tagline }}</span>
        </span>
      </a>

      <button type="button" class="app-search" @click="openPalette">
        <kt-icon name="search" :size="16" />
        <span>Search…</span>
        <kt-kbd keys="mod k" />
      </button>

      <kt-sub-menu-navigation
        class="app-nav"
        flush
        :label="WORKSPACE.name"
        :collapsed="collapsed"
        :sections="sections"
        :active-href="hrefFor(route.path)"
      />

      <div class="app-sidebar-footer">
        <div class="storage">
          <kt-meter
            label="Storage"
            :used="`${STORAGE.used} GB`"
            :total="`of ${STORAGE.total} GB`"
            :value="storagePercent"
          />
        </div>
        <span class="node-status">
          <span class="node-dot" />
          <span class="node-label">{{ `${WORKSPACE.node} · healthy` }}</span>
        </span>
        <kt-dropdown preferred-placement="top" :options="ACCOUNT_MENU" @kt-select="onAccount">
          <button type="button" slot="trigger" class="account">
            <kt-avatar :name="PERSON.name" size="small" status="online" />
            <span class="account-copy">
              <span class="account-name">{{ PERSON.name }}</span>
              <span class="account-mail">{{ PERSON.email }}</span>
            </span>
            <kt-icon name="chevrons-up-down" :size="14" />
          </button>
        </kt-dropdown>
      </div>
    </aside>
    <div class="scrim" @click="drawer = false" />

    <div class="app-main">
      <header class="app-topbar">
        <kt-button
          class="menu-button"
          variant="secondary-no-bg"
          size="small"
          icon="menu"
          label="Open the menu"
          @click="drawer = true"
        />
        <kt-button
          class="collapse-button"
          variant="secondary-no-bg"
          size="small"
          icon="panel-left"
          :label="collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'"
          @click="collapsed = !collapsed"
        />
        <button type="button" class="topbar-search" aria-label="Search" @click="openPalette">
          <kt-icon name="search" :size="16" />
          <span>Search customers, files and settings…</span>
          <kt-kbd keys="mod k" />
        </button>
        <div class="app-topbar-actions">
          <kt-tooltip text="Notifications">
            <span class="bell">
              <kt-button
                variant="secondary-no-bg"
                size="small"
                icon="bell"
                label="Notifications"
                @click="router.push('/inbox')"
              />
              <span class="bell-count" :hidden="unread === 0">{{ unread }}</span>
            </span>
          </kt-tooltip>
        </div>
      </header>
      <main class="app-content">
        <RouterView />
      </main>
    </div>

    <kt-command-palette
      ref="palette"
      placeholder="Search screens and settings…"
      :commands="COMMANDS"
      @kt-select="(event: CustomEvent<{ id: string }>) => router.push(event.detail.id)"
    />

    <div v-if="!cookies" class="cookie-bar">
      <kt-alert
        no-icon
        variant="neutral"
        description="We use first-party cookies to understand how the console is used."
      >
        <kt-button slot="actions" size="small" @click="answer('accepted')">Accept</kt-button>
        <kt-button slot="actions" size="small" variant="secondary-no-bg" @click="answer('refused')">
          Opt out
        </kt-button>
      </kt-alert>
    </div>
  </div>
</template>
