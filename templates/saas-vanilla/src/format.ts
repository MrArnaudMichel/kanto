/** Money, dates and statuses, written for people. */
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export const formatMoney = (amount: number): string => money.format(amount);

/** `2026-10-28` → "Oct 28, 2026", the day where the reader is. */
export function formatDate(iso: string): string {
  const [year, month, date] = iso.split('-').map(Number);
  return day.format(new Date(year!, month! - 1, date!));
}

export const STATUS_LABEL: Readonly<Record<string, string>> = {
  active: 'Active',
  overdue: 'Overdue',
  archived: 'Archived',
  paid: 'Paid',
  sent: 'Sent',
};
