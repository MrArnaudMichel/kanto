<script lang="ts">
import { NOTIFICATION_GROUPS } from '../data/fixtures';

/** The switches, kept while the reader moves between screens. */
const switches: Record<string, boolean> = Object.fromEntries(
  NOTIFICATION_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.on])),
);
</script>

<script setup lang="ts">
/** What the workspace tells you about: a list of switches. */
import { toaster } from 'kanto-ds';
import { reactive } from 'vue';

const on = reactive(switches);

function toggle(key: string, label: string, event: CustomEvent<{ checked: boolean }>): void {
  on[key] = event.detail.checked;
  toaster.info(`${label}: ${event.detail.checked ? 'on' : 'off'}`);
}
</script>

<template>
  <div class="screen screen-notifications">
    <kt-page-header
      eyebrow="Settings"
      heading="Notifications"
      description="What the workspace tells you about."
    />
    <div class="settings-narrow">
      <kt-form
        v-for="group in NOTIFICATION_GROUPS"
        :key="group.heading"
        :heading="group.heading"
        :description="group.description"
      >
        <div v-for="item in group.items" :key="item.key" class="setting-row">
          <div class="stack tight">
            <span>{{ item.label }}</span>
            <span v-if="item.hint" class="muted small">{{ item.hint }}</span>
          </div>
          <kt-toggle
            :label="item.label"
            :checked="on[item.key] ?? false"
            :disabled="item.locked === true"
            @kt-change="
              (event: CustomEvent<{ checked: boolean }>) => toggle(item.key, item.label, event)
            "
          />
        </div>
      </kt-form>
    </div>
  </div>
</template>
