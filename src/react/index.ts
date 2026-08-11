/**
 * React wrappers for the Kanto elements.
 *
 * React 19 can set custom-element properties and listen for custom events on
 * its own, so these wrappers are not strictly required. They are here for what
 * plain JSX still cannot give you: typed props with autocompletion, typed
 * event handlers as `onKtChange` rather than `useEffect` plus
 * `addEventListener`, and refs typed as the element rather than `HTMLElement`.
 *
 *     import { KtButton, KtInput } from 'kanto-ds/react';
 *     import 'kanto-ds/styles.css';
 *
 *     <KtInput placeholder="Search" onKtChange={(e) => setQuery(e.detail.value)} />
 *
 * React is a peer dependency: the package works without it.
 */
import * as React from 'react';
import { createComponent, type EventName } from '@lit/react';

import { KtAvatar as KtAvatarElement } from '../components/core/kt-avatar/kt-avatar.js';
import { KtBadge as KtBadgeElement } from '../components/core/kt-badge/kt-badge.js';
import { KtButton as KtButtonElement } from '../components/core/kt-button/kt-button.js';
import { KtCard as KtCardElement } from '../components/core/kt-card/kt-card.js';
import { KtChip as KtChipElement } from '../components/core/kt-chip/kt-chip.js';
import { KtCode as KtCodeElement } from '../components/core/kt-code/kt-code.js';
import { KtIcon as KtIconElement } from '../components/core/kt-icon/kt-icon.js';
import { KtKbd as KtKbdElement } from '../components/core/kt-kbd/kt-kbd.js';
import { KtDragDrop as KtDragDropElement } from '../components/forms/kt-drag-drop/kt-drag-drop.js';
import { KtForm as KtFormElement } from '../components/forms/kt-form/kt-form.js';
import { KtInput as KtInputElement } from '../components/forms/kt-input/kt-input.js';
import { KtInputMenu as KtInputMenuElement } from '../components/forms/kt-input-menu/kt-input-menu.js';
import { KtLabelInput as KtLabelInputElement } from '../components/forms/kt-label-input/kt-label-input.js';
import { KtSelect as KtSelectElement } from '../components/forms/kt-select/kt-select.js';
import { KtTextarea as KtTextareaElement } from '../components/forms/kt-textarea/kt-textarea.js';
import { KtToggle as KtToggleElement } from '../components/forms/kt-toggle/kt-toggle.js';
import { KtBreadcrumb as KtBreadcrumbElement } from '../components/navigation/kt-breadcrumb/kt-breadcrumb.js';
import { KtSegmentedControl as KtSegmentedControlElement } from '../components/navigation/kt-segmented-control/kt-segmented-control.js';
import { KtSubMenuNavigation as KtSubMenuNavigationElement } from '../components/navigation/kt-sub-menu-navigation/kt-sub-menu-navigation.js';
import { KtTabs as KtTabsElement } from '../components/navigation/kt-tabs/kt-tabs.js';
import { KtHeader as KtHeaderElement } from '../components/navigation/kt-header/kt-header.js';
import { KtToggleButton as KtToggleButtonElement } from '../components/navigation/kt-toggle-button/kt-toggle-button.js';
import { KtToggleButtonGroup as KtToggleButtonGroupElement } from '../components/navigation/kt-toggle-button-group/kt-toggle-button-group.js';
import { KtAlert as KtAlertElement } from '../components/feedback/kt-alert/kt-alert.js';
import { KtEmptyState as KtEmptyStateElement } from '../components/feedback/kt-empty-state/kt-empty-state.js';
import { KtProgressBar as KtProgressBarElement } from '../components/feedback/kt-progress-bar/kt-progress-bar.js';
import { KtSkeleton as KtSkeletonElement } from '../components/feedback/kt-skeleton/kt-skeleton.js';
import { KtToast as KtToastElement } from '../components/feedback/kt-toast/kt-toast.js';
import { KtToastContainer as KtToastContainerElement } from '../components/feedback/kt-toast-container/kt-toast-container.js';
import { KtTooltip as KtTooltipElement } from '../components/feedback/kt-tooltip/kt-tooltip.js';
import { KtConfirmDialog as KtConfirmDialogElement } from '../components/overlays/kt-confirm-dialog/kt-confirm-dialog.js';
import { KtDropdown as KtDropdownElement } from '../components/overlays/kt-dropdown/kt-dropdown.js';
import { KtModal as KtModalElement } from '../components/overlays/kt-modal/kt-modal.js';
import { KtSidePanel as KtSidePanelElement } from '../components/overlays/kt-side-panel/kt-side-panel.js';
import { KtChart as KtChartElement } from '../components/data/kt-chart/kt-chart.js';
import { KtPagination as KtPaginationElement } from '../components/data/kt-pagination/kt-pagination.js';
import { KtStat as KtStatElement } from '../components/data/kt-stat/kt-stat.js';
import { KtTable as KtTableElement } from '../components/data/kt-table/kt-table.js';

/** Narrows an event name to the detail its element actually dispatches. */
type Kt<T> = EventName<CustomEvent<T>>;

// === CORE ===
export const KtAvatar = createComponent({
  tagName: 'kt-avatar',
  elementClass: KtAvatarElement,
  react: React,
});

export const KtBadge = createComponent({
  tagName: 'kt-badge',
  elementClass: KtBadgeElement,
  react: React,
});

export const KtButton = createComponent({
  tagName: 'kt-button',
  elementClass: KtButtonElement,
  react: React,
});

export const KtCard = createComponent({
  tagName: 'kt-card',
  elementClass: KtCardElement,
  react: React,
  events: { onKtCardClick: 'kt-card-click' as Kt<never> },
});

export const KtChip = createComponent({
  tagName: 'kt-chip',
  elementClass: KtChipElement,
  react: React,
  events: { onKtChipClick: 'kt-chip-click' as Kt<never> },
});

export const KtCode = createComponent({
  tagName: 'kt-code',
  elementClass: KtCodeElement,
  react: React,
  events: { onKtCopy: 'kt-copy' as Kt<{ code: string }> },
});

export const KtIcon = createComponent({
  tagName: 'kt-icon',
  elementClass: KtIconElement,
  react: React,
});

export const KtKbd = createComponent({
  tagName: 'kt-kbd',
  elementClass: KtKbdElement,
  react: React,
});

// === FORMS ===
export const KtForm = createComponent({
  tagName: 'kt-form',
  elementClass: KtFormElement,
  react: React,
});

export const KtInput = createComponent({
  tagName: 'kt-input',
  elementClass: KtInputElement,
  react: React,
  events: {
    onKtInput: 'kt-input' as Kt<{ value: string }>,
    onKtChange: 'kt-change' as Kt<{ value: string }>,
    onKtClear: 'kt-clear' as Kt<never>,
    onKtCountryChange: 'kt-country-change' as Kt<{ country: string; dialCode: string }>,
  },
});

export const KtTextarea = createComponent({
  tagName: 'kt-textarea',
  elementClass: KtTextareaElement,
  react: React,
  events: {
    onKtInput: 'kt-input' as Kt<{ value: string }>,
    onKtChange: 'kt-change' as Kt<{ value: string }>,
  },
});

export const KtLabelInput = createComponent({
  tagName: 'kt-label-input',
  elementClass: KtLabelInputElement,
  react: React,
});

export const KtToggle = createComponent({
  tagName: 'kt-toggle',
  elementClass: KtToggleElement,
  react: React,
  events: { onKtChange: 'kt-change' as Kt<{ checked: boolean }> },
});

export const KtSelect = createComponent({
  tagName: 'kt-select',
  elementClass: KtSelectElement,
  react: React,
  events: { onKtChange: 'kt-change' as Kt<{ value: string | number | null }> },
});

export const KtInputMenu = createComponent({
  tagName: 'kt-input-menu',
  elementClass: KtInputMenuElement,
  react: React,
  events: {
    onKtChange: 'kt-change' as Kt<{ value: string | number | null }>,
    onKtFilter: 'kt-filter' as Kt<{ query: string }>,
  },
});

export const KtDragDrop = createComponent({
  tagName: 'kt-drag-drop',
  elementClass: KtDragDropElement,
  react: React,
  events: {
    onKtFilesChange: 'kt-files-change' as Kt<{ files: File[] }>,
    onKtFilesRejected: 'kt-files-rejected' as Kt<{ files: File[]; reason: 'type' | 'size' }>,
  },
});

// === NAVIGATION ===
export const KtBreadcrumb = createComponent({
  tagName: 'kt-breadcrumb',
  elementClass: KtBreadcrumbElement,
  react: React,
  events: { onKtNavigate: 'kt-navigate' as Kt<{ index: number }> },
});

export const KtSubMenuNavigation = createComponent({
  tagName: 'kt-sub-menu-navigation',
  elementClass: KtSubMenuNavigationElement,
  react: React,
  events: { onKtNavigate: 'kt-navigate' as Kt<unknown> },
});

export const KtSegmentedControl = createComponent({
  tagName: 'kt-segmented-control',
  elementClass: KtSegmentedControlElement,
  react: React,
  events: { onKtChange: 'kt-change' as Kt<{ value: string | number }> },
});

export const KtTabs = createComponent({
  tagName: 'kt-tabs',
  elementClass: KtTabsElement,
  react: React,
  events: { onKtChange: 'kt-change' as Kt<{ value: string | number }> },
});

export const KtHeader = createComponent({
  tagName: 'kt-header',
  elementClass: KtHeaderElement,
  react: React,
  events: { onKtMenuToggle: 'kt-menu-toggle' as Kt<{ open: boolean }> },
});

export const KtToggleButton = createComponent({
  tagName: 'kt-toggle-button',
  elementClass: KtToggleButtonElement,
  react: React,
  events: { onKtChange: 'kt-change' as Kt<{ selected: boolean; value: string }> },
});

export const KtToggleButtonGroup = createComponent({
  tagName: 'kt-toggle-button-group',
  elementClass: KtToggleButtonGroupElement,
  react: React,
  events: { onKtChange: 'kt-change' as Kt<{ value: string | string[] | null }> },
});

// === FEEDBACK ===
export const KtAlert = createComponent({
  tagName: 'kt-alert',
  elementClass: KtAlertElement,
  react: React,
  events: { onKtClose: 'kt-close' as Kt<never> },
});

export const KtEmptyState = createComponent({
  tagName: 'kt-empty-state',
  elementClass: KtEmptyStateElement,
  react: React,
});

export const KtProgressBar = createComponent({
  tagName: 'kt-progress-bar',
  elementClass: KtProgressBarElement,
  react: React,
});

export const KtSkeleton = createComponent({
  tagName: 'kt-skeleton',
  elementClass: KtSkeletonElement,
  react: React,
});

export const KtTooltip = createComponent({
  tagName: 'kt-tooltip',
  elementClass: KtTooltipElement,
  react: React,
});

export const KtToast = createComponent({
  tagName: 'kt-toast',
  elementClass: KtToastElement,
  react: React,
  events: { onKtToastClose: 'kt-toast-close' as Kt<never> },
});

export const KtToastContainer = createComponent({
  tagName: 'kt-toast-container',
  elementClass: KtToastContainerElement,
  react: React,
});

// === OVERLAYS ===
export const KtDropdown = createComponent({
  tagName: 'kt-dropdown',
  elementClass: KtDropdownElement,
  react: React,
  events: {
    onKtSelect: 'kt-select' as Kt<{ value: string | number }>,
    onKtOpen: 'kt-open' as Kt<never>,
    onKtClose: 'kt-close' as Kt<never>,
  },
});

export const KtModal = createComponent({
  tagName: 'kt-modal',
  elementClass: KtModalElement,
  react: React,
  events: { onKtClose: 'kt-close' as Kt<never> },
});

export const KtSidePanel = createComponent({
  tagName: 'kt-side-panel',
  elementClass: KtSidePanelElement,
  react: React,
  events: { onKtClose: 'kt-close' as Kt<never> },
});

export const KtConfirmDialog = createComponent({
  tagName: 'kt-confirm-dialog',
  elementClass: KtConfirmDialogElement,
  react: React,
  events: {
    onKtConfirm: 'kt-confirm' as Kt<never>,
    onKtCancel: 'kt-cancel' as Kt<never>,
  },
});

// === DATA ===
export const KtChart = createComponent({
  tagName: 'kt-chart',
  elementClass: KtChartElement,
  react: React,
  events: { onKtPointHover: 'kt-point-hover' as Kt<{ index: number }> },
});

export const KtTable = createComponent({
  tagName: 'kt-table',
  elementClass: KtTableElement,
  react: React,
  events: {
    onKtSortChange: 'kt-sort-change' as Kt<{
      key: string | null;
      direction: 'asc' | 'desc' | null;
    }>,
    onKtSelectionChange: 'kt-selection-change' as Kt<{ selected: unknown[] }>,
    onKtRowClick: 'kt-row-click' as Kt<{ index: number }>,
    onKtPageChange: 'kt-page-change' as Kt<{ page: number }>,
  },
});

export const KtPagination = createComponent({
  tagName: 'kt-pagination',
  elementClass: KtPaginationElement,
  react: React,
  events: { onKtPageChange: 'kt-page-change' as Kt<{ page: number }> },
});

// The imperative toaster needs no wrapper.
export { toaster } from '../components/feedback/kt-toast-container/toaster.js';

export const KtStat = createComponent({
  tagName: 'kt-stat',
  elementClass: KtStatElement,
  react: React,
});
