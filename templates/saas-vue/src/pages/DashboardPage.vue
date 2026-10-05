<script setup lang="ts">
import type { KtTableRow } from 'kanto-ds';
import { onMounted, onUnmounted, ref } from 'vue';
import { APP_NAME, INVOICE_COLUMNS } from '../content';
import { getSummary, listInvoices, type Summary } from '../data/api';
import { formatMoney } from '../format';
import { invoiceRows, revenueSeries, summaryStats } from '../view';

const summary = ref<Summary | null>(null);
const invoices = ref<KtTableRow[] | null>(null);
let live = true;

onMounted(() => {
  void getSummary().then((next) => {
    if (live) summary.value = next;
  });
  void listInvoices(6).then((next) => {
    if (live) invoices.value = invoiceRows(next);
  });
});
onUnmounted(() => {
  live = false;
});
</script>

<template>
  <kt-page-header
    :eyebrow="APP_NAME"
    heading="Overview"
    description="What is billed, paid and late this month."
  />
  <div class="stats" :aria-busy="summary === null">
    <template v-if="summary">
      <kt-stat
        v-for="stat in summaryStats(summary)"
        :key="stat.key"
        :label="stat.label"
        :value="stat.value"
        :delta="stat.delta"
        :trend="stat.trend"
        :inverted="stat.inverted"
      />
    </template>
  </div>
  <section class="panel">
    <kt-chart
      type="area"
      :height="240"
      label="Billed and paid, by month"
      :labels="summary ? [...summary.months] : []"
      :series="summary ? revenueSeries(summary) : []"
      :format="formatMoney"
    />
  </section>
  <kt-table
    label="Latest invoices"
    compact
    :columns="INVOICE_COLUMNS"
    :data="invoices ?? []"
    :loading="invoices === null"
  />
</template>
