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

import type { KtAvatar } from 'kanto';
import type { KtBadge } from 'kanto';
import type { KtButton } from 'kanto';
import type { KtCard } from 'kanto';
import type { KtCode } from 'kanto';
import type { KtIcon } from 'kanto';
import type { KtKbd } from 'kanto';
import type { KtDragDrop } from 'kanto';
import type { KtForm } from 'kanto';
import type { KtInput } from 'kanto';
import type { KtInputMenu } from 'kanto';
import type { KtLabelInput } from 'kanto';
import type { KtSelect } from 'kanto';
import type { KtTextarea } from 'kanto';
import type { KtToggle } from 'kanto';
import type { KtBreadcrumb } from 'kanto';
import type { KtPageHeader } from 'kanto';
import type { KtSegmentedControl } from 'kanto';
import type { KtSubMenuNavigation } from 'kanto';
import type { KtTabs } from 'kanto';
import type { KtHeader } from 'kanto';
import type { KtToggleButton } from 'kanto';
import type { KtToggleButtonGroup } from 'kanto';
import type { KtAlert } from 'kanto';
import type { KtEmptyState } from 'kanto';
import type { KtProgressBar } from 'kanto';
import type { KtSkeleton } from 'kanto';
import type { KtToast } from 'kanto';
import type { KtToastContainer } from 'kanto';
import type { KtTooltip } from 'kanto';
import type { KtCollapsible } from 'kanto';
import type { KtConfirmDialog } from 'kanto';
import type { KtDropdown } from 'kanto';
import type { KtModal } from 'kanto';
import type { KtSidePanel } from 'kanto';
import type { KtChart } from 'kanto';
import type { KtMeter } from 'kanto';
import type { KtPagination } from 'kanto';
import type { KtStat } from 'kanto';
import type { KtTable } from 'kanto';
import type { KtTimeline, KtTimelineItem } from 'kanto';

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
