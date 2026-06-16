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

// === ICONS ===
export { getIcon, registerIcon, registerIcons, registeredIcons } from './icons/registry.js';
export type { IconNode } from './icons/registry.js';

// === INTERNALS worth exposing ===
export { KtElement, defineElement } from './internal/kt-element.js';
