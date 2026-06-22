import { css } from 'lit';

/**
 * Shared pieces of the two option-list controls, `<kt-select>` and
 * `<kt-input-menu>`.
 *
 * They differ in how an option is chosen — pick from a list, or filter by
 * typing — but the popup, the option rows and the keyboard model are the same,
 * and having them drift apart is how a design system stops looking like one.
 */

export interface KtOption {
  readonly id: string | number;
  readonly label?: string;
  readonly disabled?: boolean;
}

/** The text to display for an option: its label, or its id as a fallback. */
export function optionLabel(option: KtOption): string {
  return option.label ?? String(option.id);
}

/** Case-insensitive substring match on the visible label. */
export function filterOptions(options: readonly KtOption[], query: string): readonly KtOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  return options.filter((option) => optionLabel(option).toLowerCase().includes(needle));
}

/**
 * The next selectable index in `direction`, skipping disabled options and
 * wrapping at both ends. Returns -1 when every option is disabled, so a caller
 * never lands the active descendant on something that cannot be chosen.
 */
export function nextEnabledIndex(
  options: readonly KtOption[],
  from: number,
  direction: 1 | -1,
): number {
  if (options.length === 0) return -1;

  for (let step = 1; step <= options.length; step += 1) {
    const index = (from + direction * step + options.length * step) % options.length;
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

/** The first selectable index, for opening a list with nothing selected. */
export function firstEnabledIndex(options: readonly KtOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

/** The last selectable index, for End. */
export function lastEnabledIndex(options: readonly KtOption[]): number {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

/**
 * The popup and option-row styles.
 *
 * The panel animates through opacity and transform while staying in the layout
 * as `visibility: hidden`, rather than being added and removed: a popup that
 * unmounts cannot animate out, and one that only sets `display: none` cannot
 * animate at all.
 */
export const listboxStyles = css`
  .popup {
    position: absolute;
    top: calc(var(--field-height, var(--button-height)) + 6px);
    left: 0;
    z-index: var(--z-dropdown);
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
    box-sizing: border-box;
    width: 100%;
    max-height: 300px;
    margin: 0;
    padding: var(--padding-expand);
    overflow: auto;
    list-style: none;
    background: var(--color-dark-20);
    border-radius: var(--radius-input);
    scrollbar-width: thin;

    visibility: hidden;
    opacity: 0;
    transform: translateY(-6px) scaleY(0.98);
    transform-origin: top left;
    pointer-events: none;
    transition:
      opacity var(--duration-fast) var(--easing-standard),
      transform var(--duration-fast) var(--easing-standard);
  }

  .popup.open {
    visibility: visible;
    opacity: 1;
    transform: translateY(0) scaleY(1);
    pointer-events: auto;
  }

  .option {
    padding: var(--padding-expand-item);
    color: var(--text-muted);
    font: var(--font-input);
    border-radius: var(--radius-input);
    cursor: pointer;
  }

  .option:hover,
  .option.active {
    background: var(--color-dark-22);
  }

  .option.selected {
    color: var(--text-body);
    font-weight: 600;
    background: var(--color-dark-23);
  }

  .option.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .empty {
    padding: var(--padding-expand-item);
    color: var(--text-muted);
    font: var(--font-normal-small);
    pointer-events: none;
  }
`;
