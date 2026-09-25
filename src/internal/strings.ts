/**
 * Every piece of copy the elements write themselves — empty states, button
 * labels, validation messages, and the accessible names a screen reader
 * announces but nobody sees.
 *
 * English by default. An application in another language replaces them once,
 * at start-up, and every element follows:
 *
 *     import { setStrings } from 'kanto-ds/strings';
 *
 *     setStrings({
 *       clear: 'Effacer',
 *       pageOf: (page, total) => `Page ${page} sur ${total}`,
 *     });
 *
 * Anything left out keeps its English default. A string an element also takes
 * as a property — `emptyText`, `placeholder`, `confirmLabel` — still wins when
 * it is set, so one screen can say something different from the rest.
 *
 * Copy that carries a value is a function, not a template with placeholders:
 * the translation owns the word order, and "Remove {name}" does not survive
 * languages that put the object first.
 */

export interface KtStrings {
  // --- Shared actions ---
  /** Clear button in fields. */
  clear: string;
  /** Close button on toasts, alerts' dismiss button. */
  close: string;
  dismiss: string;
  /** Copy button on `kt-code`, and its state once copied. */
  copy: string;
  copied: string;
  copyCode: string;
  /** The countdown bar on a toast that closes itself. */
  timeRemaining: string;
  /** Remove button on a badge or a dropped file. */
  remove: (name: string) => string;

  // --- Empty and loading states ---
  noOptions: string;
  noResults: string;
  noActions: string;
  noData: string;
  loading: string;

  // --- Fields ---
  /** `kt-select` with nothing chosen. */
  select: string;
  openList: string;
  closeList: string;
  showPassword: string;
  hidePassword: string;
  searchCountry: string;
  noCountry: string;
  countryCode: (country: string | undefined) => string;
  dragAndDrop: string;
  browseFiles: string;
  recommendedSize: (size: string) => string;
  selectedFiles: string;

  // --- Validation messages, shown by the browser on submit ---
  required: string;
  selectOption: string;
  selectFile: string;

  // --- Navigation ---
  openMenu: string;
  closeMenu: string;
  breadcrumb: string;
  secondaryNavigation: string;
  pagination: string;
  previous: string;
  next: string;
  pageOf: (page: number, total: number) => string;
  moreActions: string;

  // --- Data ---
  selectRow: string;
  selectAll: string;
  total: string;
  /** Column headers of the data table every chart renders for assistive tech. */
  chartSeries: string;
  chartPoint: string;
  chartSlice: string;
  chartShare: string;

  // --- Overlays ---
  confirmHeading: string;
  confirm: string;
  cancel: string;
  details: string;

  // --- Identity ---
  avatar: string;
}

export const defaultStrings: Readonly<KtStrings> = Object.freeze({
  clear: 'Clear',
  close: 'Close',
  dismiss: 'Dismiss',
  copy: 'Copy',
  copied: 'Copied',
  copyCode: 'Copy code',
  timeRemaining: 'Time remaining',
  remove: (name: string) => (name ? `Remove ${name}` : 'Remove'),

  noOptions: 'No options available',
  noResults: 'No results',
  noActions: 'No actions',
  noData: 'No data to display',
  loading: 'Loading…',

  select: 'Select',
  openList: 'Open list',
  closeList: 'Close list',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  searchCountry: 'Search country or dial code',
  noCountry: 'No country found',
  countryCode: (country: string | undefined) => `Country code: ${country ?? 'none'}`,
  dragAndDrop: 'Drag and drop or',
  browseFiles: 'browse your files',
  recommendedSize: (size: string) => `Recommended image size: ${size}`,
  selectedFiles: 'Selected files',

  required: 'This field is required.',
  selectOption: 'Select an option.',
  selectFile: 'Select a file.',

  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  breadcrumb: 'Breadcrumb',
  secondaryNavigation: 'Secondary navigation',
  pagination: 'Pagination',
  previous: 'Previous',
  next: 'Next',
  pageOf: (page: number, total: number) => `Page ${page} / ${total}`,
  moreActions: 'More actions',

  selectRow: 'Select row',
  selectAll: 'Select all',
  total: 'Total',
  chartSeries: 'Series',
  chartPoint: 'Point',
  chartSlice: 'Slice',
  chartShare: 'Share',

  confirmHeading: 'Are you sure?',
  confirm: 'Confirm',
  cancel: 'Cancel',
  details: 'Details',

  avatar: 'Avatar',
});

let current: KtStrings = { ...defaultStrings };
const listeners = new Set<() => void>();

/** The strings in effect. Elements read them at render time. */
export function strings(): Readonly<KtStrings> {
  return current;
}

/**
 * Replaces some or all of the strings, and re-renders every connected element
 * so the change shows at once — switching language at runtime works.
 */
export function setStrings(overrides: Partial<KtStrings>): void {
  current = { ...current, ...overrides };
  for (const listener of listeners) listener();
}

/** Back to the English defaults. */
export function resetStrings(): void {
  setStrings(defaultStrings);
}

/** Calls `listener` after every `setStrings`. Returns the unsubscribe function. */
export function onStringsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
