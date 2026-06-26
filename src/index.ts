/**
 * Kanto — the whole design system.
 *
 * Importing this module registers every element. Applications that only use a
 * few should import those directly instead, so the bundler can drop the rest:
 *
 *     import 'kanto/components/core/kt-button';
 */

// === CORE ===
export { KtButton } from './components/core/kt-button.js';
export type { KtButtonSize, KtButtonType, KtButtonVariant } from './components/core/kt-button.js';
export { KtCard } from './components/core/kt-card.js';
export type { KtCardImagePosition } from './components/core/kt-card.js';
export { KtChip } from './components/core/kt-chip.js';
export type { KtChipVariant } from './components/core/kt-chip.js';
export { KtIcon } from './components/core/kt-icon.js';

// === FORMS ===
export { KtDragDrop } from './components/forms/kt-drag-drop.js';
export { KtInput } from './components/forms/kt-input.js';
export type { KtInputSize } from './components/forms/kt-input.js';
export { KtInputMenu } from './components/forms/kt-input-menu.js';
export { KtLabelInput } from './components/forms/kt-label-input.js';
export { KtSelect } from './components/forms/kt-select.js';
export type { KtSelectSize } from './components/forms/kt-select.js';
export { KtTextarea } from './components/forms/kt-textarea.js';
export { KtToggle } from './components/forms/kt-toggle.js';
export type { KtToggleSize } from './components/forms/kt-toggle.js';

// === SHARED TYPES ===
export type { KtOption } from './internal/listbox.js';
export type { KtCountry } from './internal/countries.js';

// === ICONS ===
export { getIcon, registerIcon, registerIcons, registeredIcons } from './icons/registry.js';
export type { IconNode } from './icons/registry.js';

// === INTERNALS worth exposing ===
export { KtElement, defineElement } from './internal/kt-element.js';
