<script setup lang="ts">
/** Integrations: a grid of things that are on or off, each saying why it is there. */
import { toaster } from 'kanto-ds';
import { computed, onBeforeUnmount, shallowRef } from 'vue';
import { listIntegrations, setIntegration, type Integration } from '../data/api';

// Null until they arrive: "0 of 0 connected" would be wrong for a moment.
const all = shallowRef<readonly Integration[] | null>(null);
const open = shallowRef<Integration | null>(null);
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listIntegrations().then((loaded) => {
  if (live) all.value = loaded;
});

const on = computed(() => (all.value ?? []).filter((entry) => entry.connected).length);
const endpoint = computed(() => (open.value ? `https://api.${open.value.id}.example/v2` : ''));

function connect(entry: Integration, connected: boolean): void {
  void setIntegration(entry.id, connected).then(async () => {
    all.value = await listIntegrations();
    if (connected) toaster.success(`${entry.name} connected`);
    else toaster.info(`${entry.name} disconnected`);
  });
}

function save(): void {
  if (open.value) toaster.success(`${open.value.name} saved`);
  open.value = null;
}
</script>

<template>
  <div class="screen screen-integrations">
    <kt-page-header
      eyebrow="System"
      heading="Integrations"
      description="What this workspace is wired to."
    >
      <kt-button
        slot="actions"
        variant="dark"
        icon="book-open"
        @click="
          toaster.info(
            'Point this at your own API reference: see src/screens/IntegrationsScreen.vue.',
          )
        "
      >
        Read the API docs
      </kt-button>
    </kt-page-header>

    <kt-alert
      v-if="all"
      variant="info"
      :heading="`${on} of ${all.length} connected`"
      description="Turning one off stops its traffic; its history stays."
    />

    <div class="integration-grid">
      <kt-card v-for="entry in all ?? []" :key="entry.id">
        <div slot="header" class="row between card-head">
          <span :class="`tile-icon ${entry.tone}`"><kt-icon :name="entry.icon" :size="18" /></span>
          <kt-badge :tone="entry.connected ? 'success' : 'neutral'">
            {{ entry.connected ? 'Connected' : 'Off' }}
          </kt-badge>
        </div>
        <h3 class="integration-name">{{ entry.name }}</h3>
        <span class="muted small">{{ entry.note }}</span>
        <p class="muted">{{ entry.detail }}</p>
        <div slot="footer" class="row between card-head">
          <kt-button variant="text" size="small" @click="open = entry">Configure</kt-button>
          <kt-toggle
            size="small"
            :label="`Connect ${entry.name}`"
            :checked="entry.connected"
            @kt-change="
              (event: CustomEvent<{ checked: boolean }>) => connect(entry, event.detail.checked)
            "
          />
        </div>
      </kt-card>
    </div>

    <kt-side-panel
      :eyebrow="open?.category ?? ''"
      :heading="open?.name ?? ''"
      :open="open !== null"
      @kt-close="open = null"
    >
      <template v-if="open">
        <p class="muted">{{ open.detail }}</p>
        <kt-form heading="Connection" description="Where the console reaches it.">
          <kt-label-input label="Endpoint">
            <kt-input :value="endpoint" readonly />
          </kt-label-input>
          <kt-label-input label="Signing secret">
            <kt-input type="password" value="whsec_0000000000" readonly />
          </kt-label-input>
        </kt-form>
      </template>
      <div slot="footer" class="row end">
        <kt-button variant="dark" @click="open = null">Close</kt-button>
        <kt-button @click="save">Save</kt-button>
      </div>
    </kt-side-panel>
  </div>
</template>
