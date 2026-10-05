<script setup lang="ts">
import type { KtTableRow } from 'kanto-ds';
import { ref, watch } from 'vue';
import { CUSTOMER_COLUMNS } from '../content';
import { getCustomer, listCustomers, type Customer } from '../data/api';
import { latestOnly } from '../latest';
import { customerDetails, customerRows } from '../view';

const query = ref('');
const rows = ref<KtTableRow[] | null>(null);
const customer = ref<Customer | null>(null);

// onCleanup drops an answer that comes back after a later search was sent.
watch(
  query,
  (current, _previous, onCleanup) => {
    let live = true;
    onCleanup(() => {
      live = false;
    });
    rows.value = null;
    void listCustomers(current).then((customers) => {
      if (live) rows.value = customerRows(customers);
    });
  },
  { immediate: true },
);

function onInput(event: CustomEvent<{ value: string }>): void {
  query.value = event.detail.value;
}

const openCustomer = latestOnly(getCustomer);

function onRowClick(event: CustomEvent<{ row: KtTableRow }>): void {
  void openCustomer(String(event.detail.row.id)).then(({ stale, value }) => {
    if (!stale) customer.value = value ?? null;
  });
}
</script>

<template>
  <kt-page-header heading="Customers" description="Everyone you bill, and what they owe." />
  <kt-input
    class="search"
    type="search"
    icon="search"
    label="Search customers"
    placeholder="Search by name, email or company"
    @kt-input="onInput"
  />
  <!-- Keyed on the query: new results start on page 1. -->
  <kt-table
    :key="query"
    label="Customers"
    :page-size="10"
    :columns="CUSTOMER_COLUMNS"
    :data="rows ?? []"
    :loading="rows === null"
    @kt-row-click="onRowClick"
  />
  <kt-side-panel
    eyebrow="Customer"
    :heading="customer?.name ?? ''"
    :open="customer !== null"
    @kt-close="customer = null"
  >
    <kt-description-list :items="customer ? customerDetails(customer) : []" />
  </kt-side-panel>
</template>
