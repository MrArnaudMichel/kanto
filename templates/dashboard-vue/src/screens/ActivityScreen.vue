<script setup lang="ts">
/** The audit log, one day at a time. */
import { toaster } from 'kanto-ds';
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { listEvents, type AuditEvent, type EventKind } from '../data/api';
import { EVENT_FILTERS } from '../data/fixtures';
import SectionHeader from '../SectionHeader.vue';
import { eventsByDay } from '../views';

const events = shallowRef<readonly AuditEvent[]>([]);
const kind = ref<EventKind | 'all'>('all');
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listEvents().then((loaded) => {
  if (live) events.value = loaded;
});

const days = computed(() => eventsByDay(events.value, kind.value));
const total = computed(() => days.value.reduce((sum, day) => sum + day.events.length, 0));

// The chosen filter pressed again would leave none: everything, then.
function onKind(event: CustomEvent<{ value: string | null }>): void {
  kind.value = (event.detail.value as EventKind | null) ?? 'all';
}
</script>

<template>
  <div class="screen screen-activity">
    <kt-page-header
      eyebrow="System"
      heading="Activity"
      description="Everything that happened in this workspace, newest first. Kept for 400 days."
    >
      <kt-button
        slot="actions"
        variant="dark"
        icon="download"
        @click="toaster.info('Export started: the file will be in Files.')"
      >
        Export log
      </kt-button>
    </kt-page-header>

    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-toggle-button-group label="Filter by kind" :value="kind" @kt-change="onKind">
          <kt-toggle-button
            v-for="option in EVENT_FILTERS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </kt-toggle-button>
        </kt-toggle-button-group>
        <span class="grow" />
        <span class="muted small">{{ `${total} ${total === 1 ? 'event' : 'events'}` }}</span>
      </div>
    </kt-card>

    <div class="stack days">
      <kt-card v-if="events.length > 0 && days.length === 0">
        <kt-empty-state
          icon="activity"
          heading="Nothing of that kind"
          description="Nothing has happened under this heading in the period kept."
        >
          <kt-button slot="actions" variant="dark" @click="kind = 'all'">Show everything</kt-button>
        </kt-empty-state>
      </kt-card>
      <section v-for="day in days" v-else :key="day.day" class="stack">
        <SectionHeader :heading="day.day" />
        <kt-card>
          <kt-timeline>
            <kt-timeline-item
              v-for="event in day.events"
              :key="event.heading"
              :heading="event.heading"
              :time="event.time"
              :icon="event.icon"
              :variant="event.variant"
            >
              {{ event.body }}
              <span class="event-actor"><kt-icon name="user" :size="12" />{{ event.actor }}</span>
            </kt-timeline-item>
          </kt-timeline>
        </kt-card>
      </section>
    </div>
  </div>
</template>
