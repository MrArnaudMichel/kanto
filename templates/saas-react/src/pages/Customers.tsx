import { useEffect, useMemo, useState } from 'react';
import type { KtTableRow } from 'kanto-ds';
import { CUSTOMER_COLUMNS } from '../content';
import { getCustomer, listCustomers, type Customer } from '../data/api';
import { latestOnly } from '../latest';
import { customerDetails, customerRows } from '../view';

export function Customers() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<KtTableRow[] | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const openCustomer = useMemo(() => latestOnly(getCustomer), []);

  // The cleanup drops an answer that comes back after a later search was sent.
  useEffect(() => {
    let live = true;
    setRows(null);
    void listCustomers(query).then((customers) => {
      if (live) setRows(customerRows(customers));
    });
    return () => {
      live = false;
    };
  }, [query]);

  return (
    <>
      <kt-page-header heading="Customers" description="Everyone you bill, and what they owe." />
      <kt-input
        className="search"
        type="search"
        icon="search"
        label="Search customers"
        placeholder="Search by name, email or company"
        onkt-input={(event) => setQuery(event.detail.value)}
      />
      {/* Keyed on the query: new results start on page 1. */}
      <kt-table
        key={query}
        label="Customers"
        pageSize={10}
        columns={CUSTOMER_COLUMNS}
        data={rows ?? []}
        loading={rows === null}
        onkt-row-click={(event) => {
          void openCustomer(String(event.detail.row.id)).then(({ stale, value }) => {
            if (!stale) setCustomer(value ?? null);
          });
        }}
      />
      <kt-side-panel
        eyebrow="Customer"
        heading={customer?.name ?? ''}
        open={customer !== null}
        onkt-close={() => setCustomer(null)}
      >
        <kt-description-list items={customer ? customerDetails(customer) : []} />
      </kt-side-panel>
    </>
  );
}
