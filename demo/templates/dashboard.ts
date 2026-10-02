import type { Template } from './index.js';

export const dashboard: Template = {
  slug: 'dashboard',
  name: 'Dashboard',
  description: 'A page header with a period, four figures, a chart and the latest orders.',
  html: `<style>
  .dash {
    display: grid;
    align-content: start;
    gap: 24px;
    min-height: 100vh;
    padding: 32px;
    background: var(--surface-page);
  }
  .dash-head {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    justify-content: space-between;
  }
  .dash-head h1 {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h4);
  }
  .dash-head p {
    margin: 4px 0 0;
    color: var(--text-muted);
    font: var(--font-normal-regular);
  }
  .dash-actions {
    display: flex;
    gap: 8px;
  }
  .dash-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
</style>

<main class="dash">
  <header class="dash-head">
    <div>
      <h1>Good morning, Dana</h1>
      <p>Here is how the business did this period.</p>
    </div>
    <div class="dash-actions">
      <kt-date-picker range label="Period" value="2026-09-01/2026-09-30"></kt-date-picker>
      <kt-button variant="primary" icon="download" id="export">Export</kt-button>
    </div>
  </header>

  <section class="dash-stats">
    <kt-stat label="Revenue" value="$48,210" delta="+8.2%" trend="up"></kt-stat>
    <kt-stat label="Orders" value="1,284" delta="+3.1%" trend="up"></kt-stat>
    <kt-stat label="Customers" value="712" delta="+12%" trend="up"></kt-stat>
    <kt-stat label="Refunds" value="2.1%" delta="-0.4%" trend="down" inverted></kt-stat>
  </section>

  <kt-card>
    <h6 slot="header">Revenue by week</h6>
    <kt-chart id="revenue" type="line" label="Revenue by week" height="240"></kt-chart>
  </kt-card>

  <kt-card>
    <h6 slot="header">Latest orders</h6>
    <kt-table id="orders" label="Latest orders"></kt-table>
  </kt-card>
</main>`,
  script: `import { toaster } from 'kanto-ds';

const revenue = document.querySelector('#revenue');
revenue.labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
revenue.series = [
  { name: 'This period', values: [9.2, 10.1, 9.8, 11.4, 12.0, 11.6, 13.1, 14.2] },
  { name: 'Last period', values: [8.1, 8.6, 9.0, 9.4, 9.1, 10.2, 10.0, 10.8] },
];
revenue.format = (n) => \`$\${n}k\`;

const orders = document.querySelector('#orders');
orders.columns = [
  { key: 'id', label: 'Order', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'status', label: 'Status' },
];
orders.data = [
  { id: '#3021', customer: 'Acme Corp', total: '$1,200', status: 'Paid' },
  { id: '#3020', customer: 'Globex', total: '$860', status: 'Pending' },
  { id: '#3019', customer: 'Initech', total: '$2,430', status: 'Paid' },
  { id: '#3018', customer: 'Umbrella', total: '$310', status: 'Refunded' },
  { id: '#3017', customer: 'Hooli', total: '$4,050', status: 'Paid' },
];

document.querySelector('#export').addEventListener('click', () => {
  toaster.success('Export started', { description: 'You will get an email when it is ready.' });
});`,
};
