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
 * import { isKantoElement } from 'kanto-ds/vue';
 *
 * export default defineConfig({
 *   plugins: [vue({ template: { compilerOptions: { isCustomElement: isKantoElement } } })],
 * });
 * ```
 *
 * ```ts
 * // main.ts
 * import 'kanto-ds/vue'; // registers every element
 * import 'kanto-ds/styles.css';
 * ```
 *
 * Vue is a peer dependency: importing this module in a project without Vue
 * still works, since nothing here is imported from `vue` at runtime.
 */
// Type-only, so nothing from Vue is pulled in at runtime — but the import is
// what lets TypeScript resolve the module we augment below.
import type { Plugin } from 'vue';

import '../index.js';

import type { KtAvatar } from 'kanto-ds';
import type { KtBadge } from 'kanto-ds';
import type { KtButton } from 'kanto-ds';
import type { KtSplitButton } from 'kanto-ds';
import type { KtCard } from 'kanto-ds';
import type { KtCode } from 'kanto-ds';
import type { KtIcon } from 'kanto-ds';
import type { KtKbd } from 'kanto-ds';
import type { KtDragDrop } from 'kanto-ds';
import type { KtForm } from 'kanto-ds';
import type { KtInput } from 'kanto-ds';
import type { KtInputMenu } from 'kanto-ds';
import type { KtLabelInput } from 'kanto-ds';
import type { KtSelect } from 'kanto-ds';
import type { KtCheckbox } from 'kanto-ds';
import type { KtRadioGroup } from 'kanto-ds';
import type { KtRadio } from 'kanto-ds';
import type { KtTextarea } from 'kanto-ds';
import type { KtToggle } from 'kanto-ds';
import type { KtBreadcrumb } from 'kanto-ds';
import type { KtPageHeader } from 'kanto-ds';
import type { KtSegmentedControl } from 'kanto-ds';
import type { KtSubMenuNavigation } from 'kanto-ds';
import type { KtTabs } from 'kanto-ds';
import type { KtHeader } from 'kanto-ds';
import type { KtToggleButton } from 'kanto-ds';
import type { KtToggleButtonGroup } from 'kanto-ds';
import type { KtAlert } from 'kanto-ds';
import type { KtEmptyState } from 'kanto-ds';
import type { KtProgressBar } from 'kanto-ds';
import type { KtSkeleton } from 'kanto-ds';
import type { KtToast } from 'kanto-ds';
import type { KtToastContainer } from 'kanto-ds';
import type { KtTooltip } from 'kanto-ds';
import type { KtCollapsible } from 'kanto-ds';
import type { KtConfirmDialog } from 'kanto-ds';
import type { KtDropdown } from 'kanto-ds';
import type { KtModal } from 'kanto-ds';
import type { KtSidePanel } from 'kanto-ds';
import type { KtChart } from 'kanto-ds';
import type { KtMeter } from 'kanto-ds';
import type { KtPagination } from 'kanto-ds';
import type { KtStat } from 'kanto-ds';
import type { KtTable } from 'kanto-ds';
import type { KtTimeline, KtTimelineItem } from 'kanto-ds';

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
    'kt-split-button': KtProps<KtSplitButton>;
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
    'kt-checkbox': KtProps<KtCheckbox>;
    'kt-radio-group': KtProps<KtRadioGroup>;
    'kt-radio': KtProps<KtRadio>;
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
