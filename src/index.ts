/**
 * Kanto — the whole design system.
 *
 * Importing this module registers every element. Applications that only use a
 * few should import those directly instead, so the bundler can drop the rest:
 *
 *     import 'kanto-ds/components/core/kt-button';
 */

// === CORE ===
export { KtButton } from './components/core/kt-button/kt-button.js';
export type {
  KtButtonSize,
  KtButtonType,
  KtButtonVariant,
} from './components/core/kt-button/kt-button.js';
export { KtCard } from './components/core/kt-card/kt-card.js';
export type { KtCardImagePosition } from './components/core/kt-card/kt-card.js';
export { KtChip } from './components/core/kt-chip/kt-chip.js';
export type { KtChipVariant } from './components/core/kt-chip/kt-chip.js';
export { KtIcon } from './components/core/kt-icon/kt-icon.js';

// === FORMS ===
export { KtDragDrop } from './components/forms/kt-drag-drop/kt-drag-drop.js';
export { KtInput } from './components/forms/kt-input/kt-input.js';
export type { KtInputSize } from './components/forms/kt-input/kt-input.js';
export { KtInputMenu } from './components/forms/kt-input-menu/kt-input-menu.js';
export { KtLabelInput } from './components/forms/kt-label-input/kt-label-input.js';
export { KtSelect } from './components/forms/kt-select/kt-select.js';
export type { KtSelectSize } from './components/forms/kt-select/kt-select.js';
export { KtTextarea } from './components/forms/kt-textarea/kt-textarea.js';
export { KtToggle } from './components/forms/kt-toggle/kt-toggle.js';
export type { KtToggleSize } from './components/forms/kt-toggle/kt-toggle.js';

// === NAVIGATION ===
export { KtBreadcrumb } from './components/navigation/kt-breadcrumb/kt-breadcrumb.js';
export type { KtBreadcrumbItem } from './components/navigation/kt-breadcrumb/kt-breadcrumb.js';
export { KtSegmentedControl } from './components/navigation/kt-segmented-control/kt-segmented-control.js';
export type {
  KtSegmentedOption,
  KtSegmentedSize,
} from './components/navigation/kt-segmented-control/kt-segmented-control.js';
export { KtSubMenuNavigation } from './components/navigation/kt-sub-menu-navigation/kt-sub-menu-navigation.js';
export type {
  KtNavItem,
  KtNavSection,
} from './components/navigation/kt-sub-menu-navigation/kt-sub-menu-navigation.js';
export { KtToggleButton } from './components/navigation/kt-toggle-button/kt-toggle-button.js';
export type {
  KtToggleButtonSize,
  KtToggleButtonVariant,
} from './components/navigation/kt-toggle-button/kt-toggle-button.js';
export { KtToggleButtonGroup } from './components/navigation/kt-toggle-button-group/kt-toggle-button-group.js';

// === FEEDBACK ===
export { KtProgressBar } from './components/feedback/kt-progress-bar/kt-progress-bar.js';
export type {
  KtProgressSize,
  KtProgressVariant,
} from './components/feedback/kt-progress-bar/kt-progress-bar.js';
export { KtSkeleton } from './components/feedback/kt-skeleton/kt-skeleton.js';
export type { KtSkeletonVariant } from './components/feedback/kt-skeleton/kt-skeleton.js';
export { KtToast } from './components/feedback/kt-toast/kt-toast.js';
export type { KtToastVariant } from './components/feedback/kt-toast/kt-toast.js';
export { KtToastContainer } from './components/feedback/kt-toast-container/kt-toast-container.js';
export type {
  KtToastOptions,
  KtToastPosition,
} from './components/feedback/kt-toast-container/kt-toast-container.js';
export { toaster } from './components/feedback/kt-toast-container/toaster.js';
export { KtTooltip } from './components/feedback/kt-tooltip/kt-tooltip.js';
export type { KtTooltipPlacement } from './components/feedback/kt-tooltip/kt-tooltip.js';

// === OVERLAYS ===
export { KtConfirmDialog } from './components/overlays/kt-confirm-dialog/kt-confirm-dialog.js';
export type { KtConfirmVariant } from './components/overlays/kt-confirm-dialog/kt-confirm-dialog.js';
export { KtDropdown } from './components/overlays/kt-dropdown/kt-dropdown.js';
export type { KtDropdownPlacement } from './components/overlays/kt-dropdown/kt-dropdown.js';
export { KtSidePanel } from './components/overlays/kt-side-panel/kt-side-panel.js';

// === DATA ===
export { KtPagination } from './components/data/kt-pagination/kt-pagination.js';
export { KtTable } from './components/data/kt-table/kt-table.js';
export type {
  KtCellRenderer,
  KtSortDirection,
  KtSortState,
  KtTableColumn,
  KtTableRow,
} from './components/data/kt-table/kt-table.js';

// === SHARED TYPES ===
export type { KtOption } from './internal/listbox.js';
export type { KtCountry } from './internal/countries.js';

// === ICONS ===
export { getIcon, registerIcon, registerIcons, registeredIcons } from './icons/registry.js';
export type { IconNode } from './icons/registry.js';

// === INTERNALS worth exposing ===
export { KtElement, defineElement } from './internal/kt-element.js';
