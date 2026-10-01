/**
 * The docs site's accent chooser: the seven presets and a custom colour,
 * kept in localStorage like the theme. The library does the colour work;
 * this file only stores, applies and draws the choice.
 */
import { html, type TemplateResult } from 'lit';
import { KT_ACCENTS, parseColor, setAccent } from 'kanto-ds';

export type AccentChoice = { kind: 'preset'; id: string } | { kind: 'custom'; color: string };

const KEY = 'kanto-docs-accent';
const DEFAULT: AccentChoice = { kind: 'preset', id: 'violet' };

function isChoice(value: unknown): value is AccentChoice {
  if (typeof value !== 'object' || value === null) return false;
  const choice = value as Record<string, unknown>;
  if (choice['kind'] === 'preset') return KT_ACCENTS.some((a) => a.id === choice['id']);
  if (choice['kind'] !== 'custom' || typeof choice['color'] !== 'string') return false;
  try {
    parseColor(choice['color']);
    return true;
  } catch {
    return false;
  }
}

/** The stored choice, or violet when there is none, it is unreadable, or storage is blocked. */
export function readAccent(): AccentChoice {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return isChoice(stored) ? stored : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Applies a choice to the page and remembers it. */
export function applyAccent(
  choice: AccentChoice,
  root: HTMLElement = document.documentElement,
): void {
  if (choice.kind === 'preset') {
    setAccent(null, root);
    root.dataset['accent'] = choice.id;
  } else {
    // A custom colour replaces the preset rather than sitting over it.
    delete root.dataset['accent'];
    setAccent(choice.color, root);
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    /* the page still shows the choice */
  }
}

/** The colour a choice shows as, for the dot on the top-bar button. */
export function accentSwatch(choice: AccentChoice): string {
  if (choice.kind === 'custom') return choice.color;
  return KT_ACCENTS.find((a) => a.id === choice.id)?.color ?? KT_ACCENTS[0]!.color;
}

/** The panel: a radio group of presets, then a colour input. */
export function accentChooser(
  current: AccentChoice,
  onPick: (choice: AccentChoice) => void,
): TemplateResult {
  const checked = current.kind === 'preset' ? current.id : null;
  const focusable = checked ?? KT_ACCENTS[0]!.id;
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = KT_ACCENTS[(index + step + KT_ACCENTS.length) % KT_ACCENTS.length]!;
    onPick({ kind: 'preset', id: next.id });
    const group = (event.currentTarget as HTMLElement).parentElement;
    queueMicrotask(() =>
      group?.querySelector<HTMLElement>(`[data-accent-id="${next.id}"]`)?.focus(),
    );
  };

  const custom = current.kind === 'custom' ? current.color : null;

  return html`<div class="accent-panel">
    <p class="accent-heading">Accent colour</p>
    <div class="accent-swatches" role="radiogroup" aria-label="Accent colour">
      ${KT_ACCENTS.map(
        (accent, index) =>
          html`<button
            type="button"
            class="accent-swatch"
            role="radio"
            data-accent-id=${accent.id}
            aria-label=${accent.label}
            aria-checked=${accent.id === checked ? 'true' : 'false'}
            tabindex=${accent.id === focusable ? 0 : -1}
            style=${`--swatch: ${accent.color}`}
            @click=${() => onPick({ kind: 'preset', id: accent.id })}
            @keydown=${(event: KeyboardEvent) => onKeyDown(event, index)}
          ></button>`,
      )}
    </div>
    <label class="accent-custom">
      <!-- The native input sits invisible over a swatch of its own, so the
           row looks like the presets above it and still opens the OS picker. -->
      <span
        class=${custom ? 'accent-custom-swatch picked' : 'accent-custom-swatch'}
        style=${custom ? `--swatch: ${custom}` : ''}
      >
        ${custom ? '' : html`<kt-icon name="pipette" size="14"></kt-icon>`}
        <input
          type="color"
          .value=${custom ?? accentSwatch(current)}
          @input=${(event: Event) =>
            onPick({ kind: 'custom', color: (event.target as HTMLInputElement).value })}
        />
      </span>
      <span class="accent-custom-label">Custom colour</span>
      ${custom ? html`<code>${custom}</code>` : ''}
    </label>
  </div>`;
}

/** The top-bar control: a palette button opening the chooser. */
export function accentMenu(
  current: AccentChoice,
  onPick: (choice: AccentChoice) => void,
): TemplateResult {
  return html`<kt-dropdown align="end" class="accent-menu">
    <kt-button
      slot="trigger"
      size="small"
      variant="secondary-no-bg"
      icon="palette"
      label="Accent colour"
    ></kt-button>
    <div slot="panel">${accentChooser(current, onPick)}</div>
  </kt-dropdown>`;
}
