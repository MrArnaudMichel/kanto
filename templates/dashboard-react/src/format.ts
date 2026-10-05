/** Money, statuses and file kinds, written for people. */
import type { FileRow } from './data/api';
import type { Status } from './data/generate';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatMoney = (amount: number): string => money.format(amount);
export const formatCents = (amount: number): string => cents.format(amount);

/** A status's colour, read from the theme. */
export const STATUS_COLOR: Readonly<Record<Status, string>> = {
  Active: 'var(--color-success-base)',
  Pending: 'var(--color-warning-base)',
  Archived: 'var(--text-muted)',
};

export const KIND_ICON: Readonly<Record<FileRow['kind'], string>> = {
  PDF: 'file-text',
  Sheet: 'table',
  Image: 'image',
  Archive: 'file-archive',
  Doc: 'file',
};

export const KIND_COLOR: Readonly<Record<FileRow['kind'], string>> = {
  PDF: 'var(--color-danger-base)',
  Sheet: 'var(--color-success-base)',
  Image: 'var(--chart-series-5)',
  Archive: 'var(--color-warning-base)',
  Doc: 'var(--chart-series-1)',
};
