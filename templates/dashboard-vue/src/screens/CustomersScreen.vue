<script setup lang="ts">
/** The customers: filter, sort, select, act on several, inspect one. */
import { toaster } from 'kanto-ds';
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { customerCell } from '../cells';
import { deleteCustomers, listCustomers, type Entity } from '../data/api';
import { PLANS, REGIONS } from '../data/generate';
import { formatMoney } from '../format';
import { activeFilters, customerPage, NO_FILTERS, PAGE_SIZE, type CustomerQuery } from '../views';

const COLUMNS = [
  { key: 'owner', label: 'Customer', sortable: true },
  { key: 'ref', label: 'Account', sortable: true, width: '120px' },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'plan', label: 'Plan', sortable: true, width: '120px' },
  { key: 'amount', label: 'MRR', sortable: true, align: 'right' as const },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
];
const PLAN_OPTIONS = PLANS.map((name) => ({ id: name, label: name }));
const REGION_OPTIONS = REGIONS.map((name) => ({ id: name, label: name }));

const all = shallowRef<readonly Entity[] | null>(null);
const query = shallowRef<CustomerQuery>(NO_FILTERS);
const selected = ref<number[]>([]);
const detail = shallowRef<Entity | null>(null);
const confirming = ref(false);
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listCustomers().then((rows) => {
  if (live) all.value = rows;
});

const shown = computed(() => customerPage(all.value ?? [], query.value));
const filters = computed(() => activeFilters(query.value) + (query.value.query ? 1 : 0));
const plural = computed(() => (selected.value.length > 1 ? 's' : ''));

function filter(patch: Partial<CustomerQuery>): void {
  query.value = { ...query.value, page: 1, ...patch };
}

function onSort(
  event: CustomEvent<{ key: string | null; direction: 'asc' | 'desc' | null }>,
): void {
  query.value = {
    ...query.value,
    sortKey: event.detail.key,
    sortDirection: event.detail.direction,
  };
}

function remove(): void {
  const ids = selected.value;
  confirming.value = false;
  void deleteCustomers(ids).then(async () => {
    all.value = await listCustomers();
    selected.value = [];
    toaster.success(`${ids.length} customer${ids.length > 1 ? 's' : ''} deleted`);
  });
}

const details = computed(() =>
  detail.value
    ? [
        ['Region', detail.value.region],
        ['Plan', detail.value.plan],
        ['MRR', formatMoney(detail.value.amount)],
        ['Last activity', detail.value.updated],
      ]
    : [],
);
</script>

<template>
  <div class="screen screen-customers">
    <kt-page-header
      eyebrow="Workspace"
      heading="Customers"
      description="Every account this workspace bills, with the filters the support team uses."
    >
      <kt-button
        slot="actions"
        variant="dark"
        icon="download"
        @click="toaster.info(`Exporting ${shown.total} customers…`)"
      >
        Export
      </kt-button>
    </kt-page-header>

    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-input
          class="customer-search"
          placeholder="Search customers…"
          icon="search"
          label="Search customers"
          :value="query.query"
          @kt-input="
            (event: CustomEvent<{ value: string }>) => filter({ query: event.detail.value })
          "
        />
        <kt-select
          class="customer-plan"
          placeholder="Any plan"
          label="Plan"
          :options="PLAN_OPTIONS"
          :value="query.plan"
          @kt-change="
            (event: CustomEvent<{ value: string | null }>) => filter({ plan: event.detail.value })
          "
        />
        <kt-multi-select
          class="customer-regions"
          label="Region"
          placeholder="Any region"
          :options="REGION_OPTIONS"
          :value="[...query.regions]"
          @kt-change="
            (event: CustomEvent<{ value: string[] }>) => filter({ regions: event.detail.value })
          "
        />
        <span class="grow" />
        <kt-button
          v-if="filters > 0"
          variant="secondary-no-bg"
          size="small"
          icon="x"
          @click="filter({ query: '', plan: null, regions: [] })"
        >
          {{ `Clear ${filters}` }}
        </kt-button>
      </div>
    </kt-card>

    <div v-if="selected.length > 0" class="bulk-bar">
      <span
        ><strong>{{ selected.length }}</strong> selected</span
      >
      <div class="row">
        <kt-button
          size="small"
          variant="dark"
          icon="mail"
          @click="toaster.success(`Emailed ${selected.length} customer${plural}`)"
        >
          Email
        </kt-button>
        <kt-button size="small" variant="danger" icon="trash-2" @click="confirming = true">
          Delete
        </kt-button>
      </div>
    </div>

    <kt-card>
      <kt-table
        label="Customers"
        selectable
        manual
        :page-size="PAGE_SIZE"
        :columns="COLUMNS"
        :data="shown.rows"
        :page="shown.page"
        :total-rows="shown.total"
        :loading="all === null"
        :selected="selected"
        :sort-key="query.sortKey"
        :sort-direction="query.sortDirection"
        :empty-text="filters > 0 ? 'No customer matches these filters.' : 'No customers yet.'"
        :render-cell="customerCell"
        @kt-sort-change="onSort"
        @kt-page-change="
          (event: CustomEvent<{ page: number }>) => (query = { ...query, page: event.detail.page })
        "
        @kt-selection-change="
          (event: CustomEvent<{ selected: number[] }>) => (selected = [...event.detail.selected])
        "
        @kt-row-click="(event: CustomEvent<{ row: Entity }>) => (detail = event.detail.row)"
      />
      <div slot="footer" class="table-footer">
        <span class="muted small customer-count">
          {{ `${shown.total} of ${all?.length ?? 0} customers` }}
        </span>
      </div>
    </kt-card>

    <kt-side-panel
      eyebrow="Customer"
      :heading="detail?.owner ?? ''"
      :open="detail !== null"
      @kt-close="detail = null"
    >
      <div v-if="detail" class="stack">
        <div class="row">
          <kt-avatar :name="detail.owner" size="large" />
          <div class="stack tight">
            <strong>{{ detail.owner }}</strong>
            <span class="muted small">{{ detail.ref }}</span>
          </div>
        </div>
        <div v-for="[label, value] in details" :key="label" class="detail-row">
          <span class="overline">{{ label }}</span>
          <span>{{ value }}</span>
        </div>
        <kt-alert variant="info" description="This account renews in 14 days." />
      </div>
      <kt-button slot="footer" variant="dark" @click="detail = null">Close</kt-button>
    </kt-side-panel>

    <kt-confirm-dialog
      :open="confirming"
      :heading="`Delete ${selected.length} customer${plural}?`"
      message="Their history goes with them. This cannot be undone."
      confirm-label="Delete"
      variant="danger"
      @kt-confirm="remove"
      @kt-cancel="confirming = false"
    />
  </div>
</template>
