/**
 * Vue integration for the Kanto elements.
 *
 * There are no per-component wrappers here, and that is the point. Vue 3
 * renders custom elements natively and sets non-primitive bindings as DOM
 * properties, so `<kt-select :options="regions">` already works. A wrapper
 * layer would only be one more thing to keep in sync.
 *
 * What Vue cannot infer on its own is which tags are custom elements, and what
 * they accept. That is what this module supplies.
 *
 * ```ts
 * // vite.config.ts
 * import vue from '@vitejs/plugin-vue';
 * import { isKantoElement } from 'kanto/vue';
 *
 * export default defineConfig({
 *   plugins: [vue({ template: { compilerOptions: { isCustomElement: isKantoElement } } })],
 * });
 * ```
 *
 * ```ts
 * // main.ts
 * import 'kanto/vue'; // registers every element
 * import 'kanto/styles.css';
 * ```
 *
 * Vue is a peer dependency: importing this module in a project without Vue
 * still works, since nothing here is imported from `vue` at runtime.
 */
// Type-only, so nothing from Vue is pulled in at runtime — but the import is
// what lets TypeScript resolve the module we augment below.
import type { Plugin } from 'vue';

import '../index.js';

import type { KtAvatar } from '../components/core/kt-avatar/kt-avatar.js';
import type { KtBadge } from '../components/core/kt-badge/kt-badge.js';
import type { KtButton } from '../components/core/kt-button/kt-button.js';
import type { KtCard } from '../components/core/kt-card/kt-card.js';
import type { KtCode } from '../components/core/kt-code/kt-code.js';
import type { KtIcon } from '../components/core/kt-icon/kt-icon.js';
import type { KtKbd } from '../components/core/kt-kbd/kt-kbd.js';
import type { KtDragDrop } from '../components/forms/kt-drag-drop/kt-drag-drop.js';
import type { KtForm } from '../components/forms/kt-form/kt-form.js';
import type { KtInput } from '../components/forms/kt-input/kt-input.js';
import type { KtInputMenu } from '../components/forms/kt-input-menu/kt-input-menu.js';
import type { KtLabelInput } from '../components/forms/kt-label-input/kt-label-input.js';
import type { KtSelect } from '../components/forms/kt-select/kt-select.js';
import type { KtTextarea } from '../components/forms/kt-textarea/kt-textarea.js';
import type { KtToggle } from '../components/forms/kt-toggle/kt-toggle.js';
import type { KtBreadcrumb } from '../components/navigation/kt-breadcrumb/kt-breadcrumb.js';
import type { KtPageHeader } from '../components/navigation/kt-page-header/kt-page-header.js';
import type { KtSegmentedControl } from '../components/navigation/kt-segmented-control/kt-segmented-control.js';
import type { KtSubMenuNavigation } from '../components/navigation/kt-sub-menu-navigation/kt-sub-menu-navigation.js';
import type { KtTabs } from '../components/navigation/kt-tabs/kt-tabs.js';
import type { KtHeader } from '../components/navigation/kt-header/kt-header.js';
import type { KtToggleButton } from '../components/navigation/kt-toggle-button/kt-toggle-button.js';
import type { KtToggleButtonGroup } from '../components/navigation/kt-toggle-button-group/kt-toggle-button-group.js';
import type { KtAlert } from '../components/feedback/kt-alert/kt-alert.js';
import type { KtEmptyState } from '../components/feedback/kt-empty-state/kt-empty-state.js';
import type { KtProgressBar } from '../components/feedback/kt-progress-bar/kt-progress-bar.js';
import type { KtSkeleton } from '../components/feedback/kt-skeleton/kt-skeleton.js';
import type { KtToast } from '../components/feedback/kt-toast/kt-toast.js';
import type { KtToastContainer } from '../components/feedback/kt-toast-container/kt-toast-container.js';
import type { KtTooltip } from '../components/feedback/kt-tooltip/kt-tooltip.js';
import type { KtCollapsible } from '../components/overlays/kt-collapsible/kt-collapsible.js';
import type { KtConfirmDialog } from '../components/overlays/kt-confirm-dialog/kt-confirm-dialog.js';
import type { KtDropdown } from '../components/overlays/kt-dropdown/kt-dropdown.js';
import type { KtModal } from '../components/overlays/kt-modal/kt-modal.js';
import type { KtSidePanel } from '../components/overlays/kt-side-panel/kt-side-panel.js';
import type { KtChart } from '../components/data/kt-chart/kt-chart.js';
import type { KtMeter } from '../components/data/kt-meter/kt-meter.js';
import type { KtPagination } from '../components/data/kt-pagination/kt-pagination.js';
import type { KtStat } from '../components/data/kt-stat/kt-stat.js';
import type { KtTable } from '../components/data/kt-table/kt-table.js';
import type { KtTimeline, KtTimelineItem } from '../components/data/kt-timeline/kt-timeline.js';

/**
 * True for any Kanto custom element.
 *
 * Pass it as `compilerOptions.isCustomElement` so the Vue compiler stops
 * trying to resolve `kt-*` tags as components.
 */
export function isKantoElement(tag: string): boolean {
  return tag.startsWith('kt-');
}

/** Every element's tag name, for anyone building their own predicate. */
export const KANTO_TAG_PREFIX = 'kt-';

/**
 * What a Kanto element accepts in a template: its own properties, plus the
 * attributes and listeners any element takes.
 */
type KtProps<T> = Partial<T> &
  Record<`on${string}`, unknown> & { class?: unknown; style?: unknown };

declare module 'vue' {
  interface GlobalComponents {
    'kt-avatar': KtProps<KtAvatar>;
    'kt-badge': KtProps<KtBadge>;
    'kt-button': KtProps<KtButton>;
    'kt-card': KtProps<KtCard>;
    'kt-code': KtProps<KtCode>;
    'kt-icon': KtProps<KtIcon>;
    'kt-kbd': KtProps<KtKbd>;
    'kt-drag-drop': KtProps<KtDragDrop>;
    'kt-form': KtProps<KtForm>;
    'kt-input': KtProps<KtInput>;
    'kt-input-menu': KtProps<KtInputMenu>;
    'kt-label-input': KtProps<KtLabelInput>;
    'kt-select': KtProps<KtSelect>;
    'kt-textarea': KtProps<KtTextarea>;
    'kt-toggle': KtProps<KtToggle>;
    'kt-breadcrumb': KtProps<KtBreadcrumb>;
    'kt-page-header': KtProps<KtPageHeader>;
    'kt-segmented-control': KtProps<KtSegmentedControl>;
    'kt-sub-menu-navigation': KtProps<KtSubMenuNavigation>;
    'kt-tabs': KtProps<KtTabs>;
    'kt-header': KtProps<KtHeader>;
    'kt-toggle-button': KtProps<KtToggleButton>;
    'kt-toggle-button-group': KtProps<KtToggleButtonGroup>;
    'kt-alert': KtProps<KtAlert>;
    'kt-empty-state': KtProps<KtEmptyState>;
    'kt-progress-bar': KtProps<KtProgressBar>;
    'kt-skeleton': KtProps<KtSkeleton>;
    'kt-toast': KtProps<KtToast>;
    'kt-toast-container': KtProps<KtToastContainer>;
    'kt-tooltip': KtProps<KtTooltip>;
    'kt-collapsible': KtProps<KtCollapsible>;
    'kt-confirm-dialog': KtProps<KtConfirmDialog>;
    'kt-dropdown': KtProps<KtDropdown>;
    'kt-modal': KtProps<KtModal>;
    'kt-side-panel': KtProps<KtSidePanel>;
    'kt-chart': KtProps<KtChart>;
    'kt-meter': KtProps<KtMeter>;
    'kt-pagination': KtProps<KtPagination>;
    'kt-stat': KtProps<KtStat>;
    'kt-table': KtProps<KtTable>;
    'kt-timeline': KtProps<KtTimeline>;
    'kt-timeline-item': KtProps<KtTimelineItem>;
  }
}

/**
 * A no-op plugin, for apps that would rather write `app.use(kanto)` than a
 * bare side-effect import. Importing this module already registers every
 * element; this only makes that visible in `main.ts`.
 */
export const kanto: Plugin = {
  install() {
    /* the elements register themselves on import */
  },
};

export { toaster } from '../components/feedback/kt-toast-container/toaster.js';
