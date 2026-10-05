<script setup lang="ts">
/** The overview: the numbers, the trend, the latest orders and what happened lately. */
import { toaster } from 'kanto-ds';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { orderCell } from '../cells';
import { getOverview, type Grain, type Overview } from '../data/api';
import { PERSON } from '../data/fixtures';
import { formatMoney } from '../format';
import { hrefFor } from '../nav';
import SectionHeader from '../SectionHeader.vue';
import TileCard from '../TileCard.vue';

const GRAINS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const ORDER_COLUMNS = [
  { key: 'ref', label: 'ID', sortable: true, width: '110px' },
  { key: 'updated', label: 'Date' },
  { key: 'status', label: 'Status', width: '130px' },
  { key: 'owner', label: 'Customer', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
];

const formatAxis = (n: number) => formatMoney(n);
const formatGb = (n: number) => `${n} GB`;

const grain = ref<Grain>('daily');
// Bumped by Refresh: the same grain, loaded again.
const reloads = ref(0);
const overview = shallowRef<Overview | null>(null);
const loading = ref(true);
const hovered = ref(-1);
let live = true;
onBeforeUnmount(() => {
  live = false;
});

watch(
  [grain, reloads],
  () => {
    loading.value = true;
    hovered.value = -1;
    void getOverview(grain.value).then((next) => {
      if (!live) return;
      overview.value = next;
      loading.value = false;
    });
  },
  { immediate: true },
);

const point = computed(() => overview.value?.revenue[hovered.value]);
const greeting = `Welcome back, ${PERSON.name.split(' ')[0]}`;
</script>

<template>
  <div class="screen screen-home">
    <kt-page-header
      eyebrow="Dashboard"
      :heading="greeting"
      description="An overview of the workspace: revenue, recent orders, integrations and what changed."
    >
      <kt-button
        slot="actions"
        variant="dark"
        icon="download"
        @click="toaster.info('Export started: the file will be in Files.')"
      >
        Export
      </kt-button>
      <kt-button
        slot="actions"
        icon="plus"
        @click="toaster.info('Orders are created from a customer: open one in Customers.')"
      >
        New order
      </kt-button>
    </kt-page-header>

    <kt-card class="toolbar-card">
      <div class="toolbar">
        <span class="row muted"><kt-icon name="calendar" :size="16" />Aug 12 – Sep 10, 2026</span>
        <kt-select
          class="grain"
          label="Grain"
          :clearable="false"
          :options="GRAINS"
          :value="grain"
          @kt-change="(event: CustomEvent<{ value: Grain }>) => (grain = event.detail.value)"
        />
        <span class="grow" />
        <kt-button variant="dark" icon="refresh-cw" :disabled="loading" @click="reloads++">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </kt-button>
      </div>
    </kt-card>

    <div class="tile-row">
      <TileCard
        v-for="tile in overview?.tiles ?? []"
        :key="tile.label"
        :tile="tile"
        :loading="loading"
      />
    </div>

    <kt-card>
      <div slot="header">
        <div class="overline">Revenue</div>
        <div class="revenue-figure">{{ formatMoney(point ?? overview?.total ?? 0) }}</div>
        <div class="muted small">
          {{
            point === undefined
              ? 'Total for the period'
              : `${overview?.labels[hovered]} · one point in the period`
          }}
        </div>
      </div>
      <kt-skeleton v-if="loading || !overview" variant="rect" height="240px" />
      <kt-chart
        v-else
        type="area"
        :height="240"
        smooth
        label="Revenue over the selected period"
        :labels="[...overview.labels]"
        :series="[{ name: 'Revenue', values: [...overview.revenue] }]"
        :format="formatAxis"
        @kt-point-hover="(event: CustomEvent<{ index: number }>) => (hovered = event.detail.index)"
      />
    </kt-card>

    <section class="stack">
      <SectionHeader
        heading="Latest orders"
        :link="{ label: 'See all customers', href: hrefFor('/customers') }"
      />
      <kt-card>
        <kt-table
          label="Latest orders"
          compact
          :loading="loading"
          :columns="ORDER_COLUMNS"
          :data="overview?.orders ?? []"
          :render-cell="orderCell"
        />
      </kt-card>
    </section>

    <div class="panel-row">
      <kt-card>
        <div slot="header" class="card-head">
          <SectionHeader
            heading="Recent activity"
            :link="{ label: 'All activity', href: hrefFor('/activity') }"
          />
        </div>
        <kt-timeline compact>
          <kt-timeline-item
            v-for="event in overview?.activity ?? []"
            :key="event.heading"
            :heading="event.heading"
            :time="event.time"
            :icon="event.icon"
            :variant="event.variant"
          >
            {{ event.body }}
          </kt-timeline-item>
        </kt-timeline>
      </kt-card>

      <kt-card>
        <div slot="header" class="card-head">
          <SectionHeader
            heading="Integrations"
            :link="{ label: 'Manage', href: hrefFor('/integrations') }"
          />
        </div>
        <ul class="mini-list">
          <li v-for="entry in overview?.integrations ?? []" :key="entry.id" class="mini-row">
            <span class="mini-icon"><kt-icon :name="entry.icon" :size="16" /></span>
            <span class="mini-copy">
              <span class="mini-title">{{ entry.name }}</span>
              <span class="muted small">{{ entry.note }}</span>
            </span>
            <kt-badge :tone="entry.connected ? 'success' : 'neutral'">
              {{ entry.connected ? 'Connected' : 'Off' }}
            </kt-badge>
          </li>
        </ul>
      </kt-card>

      <kt-card>
        <div slot="header" class="card-head">
          <SectionHeader heading="Storage" :link="{ label: 'Details', href: hrefFor('/files') }" />
        </div>
        <template v-if="overview">
          <kt-meter
            show-legend
            :max="overview.storage.total"
            :segments="overview.storage.segments"
            :format="formatGb"
          />
          <p class="muted small">
            {{
              `${overview.storage.used} GB of ${overview.storage.total} GB used. Backups are pruned after 90 days.`
            }}
          </p>
        </template>
      </kt-card>
    </div>
  </div>
</template>
