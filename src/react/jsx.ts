/**
 * JSX typings for the Kanto elements, for React 19.
 *
 * React 19 renders custom elements natively: it sets a prop as a property when
 * the element has one — so `options={regions}` reaches `<kt-select>` as an
 * array — and a prop named `on` + an event name listens for that event, so
 * `onkt-change` hears `kt-change`. What it cannot know is which tags exist
 * and what they take; without this module TypeScript rejects every `kt-*`
 * tag. It is types only: importing it loads nothing, and it needs no package
 * beyond React itself.
 *
 *     import 'kanto-ds';
 *     import 'kanto-ds/styles.css';
 *     import type {} from 'kanto-ds/react/jsx';
 *
 *     <kt-select options={regions} onkt-change={(e) => setRegion(e.detail.value)} />
 *
 * React 18 cannot do either, which is what the wrappers in `kanto-ds/react`
 * are for.
 */
import type * as React from 'react';
import type {
  KtAvatar,
  KtBadge,
  KtButton,
  KtSplitButton,
  KtCard,
  KtCode,
  KtIcon,
  KtKbd,
  KtForm,
  KtInput,
  KtTextarea,
  KtLabelInput,
  KtToggle,
  KtSelect,
  KtCheckbox,
  KtRadioGroup,
  KtRadio,
  KtInputMenu,
  KtDragDrop,
  KtBreadcrumb,
  KtSubMenuNavigation,
  KtPageHeader,
  KtSegmentedControl,
  KtTabs,
  KtHeader,
  KtToggleButton,
  KtToggleButtonGroup,
  KtAlert,
  KtEmptyState,
  KtProgressBar,
  KtSkeleton,
  KtTooltip,
  KtToast,
  KtToastContainer,
  KtCollapsible,
  KtDropdown,
  KtModal,
  KtSidePanel,
  KtConfirmDialog,
  KtChart,
  KtTable,
  KtMeter,
  KtPagination,
  KtStat,
  KtTimeline,
  KtTimelineItem,
} from 'kanto-ds';

/** The `on<event>` props React 19 turns into listeners, typed by their detail. */
type Handlers<E> = {
  [K in keyof E & string as `on${K}`]?: (event: CustomEvent<E[K]>) => void;
};

/**
 * What a `kt-*` tag accepts in JSX: its own public properties, the usual
 * HTML attributes and a typed ref, plus a handler for each event it fires.
 */
type KtProps<T extends HTMLElement, E = Record<never, never>> = Partial<
  Omit<T, keyof HTMLElement>
> &
  React.HTMLAttributes<T> &
  React.RefAttributes<T> &
  Handlers<E>;

declare module 'react' {
  // React declares its JSX types in a namespace; augmenting them means reopening it.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'kt-avatar': KtProps<KtAvatar>;
      'kt-badge': KtProps<KtBadge, { 'kt-badge-click': never; 'kt-remove': never }>;
      'kt-button': KtProps<KtButton>;
      'kt-split-button': KtProps<
        KtSplitButton,
        { 'kt-select': { value: string | number }; 'kt-open': never; 'kt-close': never }
      >;
      'kt-card': KtProps<KtCard, { 'kt-card-click': never }>;
      'kt-code': KtProps<KtCode, { 'kt-copy': { code: string } }>;
      'kt-icon': KtProps<KtIcon>;
      'kt-kbd': KtProps<KtKbd>;
      'kt-form': KtProps<KtForm>;
      'kt-input': KtProps<
        KtInput,
        {
          'kt-input': { value: string };
          'kt-change': { value: string };
          'kt-clear': never;
          'kt-country-change': { country: string; dialCode: string };
        }
      >;
      'kt-textarea': KtProps<
        KtTextarea,
        { 'kt-input': { value: string }; 'kt-change': { value: string } }
      >;
      'kt-label-input': KtProps<KtLabelInput>;
      'kt-toggle': KtProps<KtToggle, { 'kt-change': { checked: boolean } }>;
      'kt-checkbox': KtProps<KtCheckbox, { 'kt-change': { checked: boolean } }>;
      'kt-radio-group': KtProps<KtRadioGroup, { 'kt-change': { value: string | null } }>;
      'kt-radio': KtProps<KtRadio>;
      'kt-select': KtProps<KtSelect, { 'kt-change': { value: string | number | null } }>;
      'kt-input-menu': KtProps<
        KtInputMenu,
        { 'kt-change': { value: string | number | null }; 'kt-filter': { query: string } }
      >;
      'kt-drag-drop': KtProps<
        KtDragDrop,
        {
          'kt-files-change': { files: File[] };
          'kt-files-rejected': { files: File[]; reason: 'type' | 'size' };
        }
      >;
      'kt-breadcrumb': KtProps<KtBreadcrumb, { 'kt-navigate': { index: number } }>;
      'kt-sub-menu-navigation': KtProps<KtSubMenuNavigation, { 'kt-navigate': unknown }>;
      'kt-page-header': KtProps<KtPageHeader>;
      'kt-segmented-control': KtProps<
        KtSegmentedControl,
        { 'kt-change': { value: string | number } }
      >;
      'kt-tabs': KtProps<KtTabs, { 'kt-change': { value: string | number } }>;
      'kt-header': KtProps<KtHeader, { 'kt-menu-toggle': { open: boolean } }>;
      'kt-toggle-button': KtProps<
        KtToggleButton,
        { 'kt-change': { selected: boolean; value: string } }
      >;
      'kt-toggle-button-group': KtProps<
        KtToggleButtonGroup,
        { 'kt-change': { value: string | string[] | null } }
      >;
      'kt-alert': KtProps<KtAlert, { 'kt-close': never }>;
      'kt-empty-state': KtProps<KtEmptyState>;
      'kt-progress-bar': KtProps<KtProgressBar>;
      'kt-skeleton': KtProps<KtSkeleton>;
      'kt-tooltip': KtProps<KtTooltip>;
      'kt-toast': KtProps<KtToast, { 'kt-toast-close': never }>;
      'kt-toast-container': KtProps<KtToastContainer>;
      'kt-collapsible': KtProps<KtCollapsible, { 'kt-toggle': { open: boolean } }>;
      'kt-dropdown': KtProps<
        KtDropdown,
        { 'kt-select': { value: string | number }; 'kt-open': never; 'kt-close': never }
      >;
      'kt-modal': KtProps<KtModal, { 'kt-close': never }>;
      'kt-side-panel': KtProps<KtSidePanel, { 'kt-close': never }>;
      'kt-confirm-dialog': KtProps<KtConfirmDialog, { 'kt-confirm': never; 'kt-cancel': never }>;
      'kt-chart': KtProps<
        KtChart,
        {
          'kt-point-hover': { index: number; series: number };
          'kt-series-toggle': { series: number; hidden: boolean };
        }
      >;
      'kt-table': KtProps<
        KtTable,
        {
          'kt-sort-change': { key: string | null; direction: 'asc' | 'desc' | null };
          'kt-selection-change': { selected: unknown[] };
          'kt-row-click': { index: number };
          'kt-page-change': { page: number };
        }
      >;
      'kt-meter': KtProps<KtMeter>;
      'kt-pagination': KtProps<KtPagination, { 'kt-page-change': { page: number } }>;
      'kt-stat': KtProps<KtStat>;
      'kt-timeline': KtProps<KtTimeline>;
      'kt-timeline-item': KtProps<KtTimelineItem>;
    }
  }
}
