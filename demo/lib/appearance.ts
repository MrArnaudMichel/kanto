/**
 * The docs site's Customise menu: the whole appearance — theme, accent,
 * font, corners, density, text size — kept in localStorage and applied
 * through the library's setAppearance. Only the storage and the panel live
 * here; the library does the rest.
 */
import { html, type TemplateResult } from 'lit';
import {
  KT_ACCENTS,
  KT_DEFAULT_APPEARANCE,
  KT_DENSITIES,
  KT_FONTS,
  KT_RADII,
  KT_TEXT_SIZES,
  KT_THEMES,
  parseColor,
  setAppearance,
  type KtAppearance,
  type KtFont,
} from 'kanto-ds';

export type DocsAppearance = Required<KtAppearance>;

const KEY = 'kanto-docs-appearance';
const OLD_THEME = 'kanto-docs-theme';
const OLD_ACCENT = 'kanto-docs-accent';

const LISTS = {
  theme: KT_THEMES,
  font: KT_FONTS,
  radius: KT_RADII,
  density: KT_DENSITIES,
  textSize: KT_TEXT_SIZES,
} as const;

function validAccent(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (KT_ACCENTS.some((accent) => accent.id === value)) return true;
  try {
    parseColor(value);
    return true;
  } catch {
    return false;
  }
}

/** Whatever was stored, field by field: each one valid, or the default. */
function sanitise(stored: Record<string, unknown>): DocsAppearance {
  const result: Record<string, string> = { ...KT_DEFAULT_APPEARANCE };
  for (const [key, list] of Object.entries(LISTS)) {
    const value = stored[key];
    if (list.some((choice) => choice.id === value)) result[key] = value as string;
  }
  if (validAccent(stored['accent'])) result['accent'] = stored['accent'];
  return result as DocsAppearance;
}

/** The theme and accent the site kept before it kept a whole appearance. */
function migrated(): Record<string, unknown> {
  const old: Record<string, unknown> = {};
  if (localStorage.getItem(OLD_THEME) === 'light') old['theme'] = 'light';
  try {
    const accent = JSON.parse(localStorage.getItem(OLD_ACCENT) ?? 'null') as {
      kind?: string;
      id?: string;
      color?: string;
    } | null;
    if (accent?.kind === 'preset') old['accent'] = accent.id;
    if (accent?.kind === 'custom') old['accent'] = accent.color;
  } catch {
    /* an unreadable old accent is no accent */
  }
  return old;
}

/** The stored appearance; the defaults when there is none, it is unreadable, or storage is blocked. */
export function readDocsAppearance(): DocsAppearance {
  try {
    const stored = localStorage.getItem(KEY);
    return sanitise(stored === null ? migrated() : (JSON.parse(stored) as Record<string, unknown>));
  } catch {
    return { ...KT_DEFAULT_APPEARANCE };
  }
}

/** Applies an appearance to the page and keeps it. */
export function applyDocsAppearance(appearance: DocsAppearance): void {
  setAppearance(appearance);
  try {
    localStorage.setItem(KEY, JSON.stringify(appearance));
    localStorage.removeItem(OLD_THEME);
    localStorage.removeItem(OLD_ACCENT);
  } catch {
    /* the page still shows it */
  }
}

/**
 * Arrow keys across a radio group: each one picks the next choice and moves
 * the focus with it, wrapping at the ends.
 */
function arrows<T extends string>(
  ids: readonly T[],
  attribute: string,
  onPick: (id: T) => void,
): (event: KeyboardEvent, index: number) => void {
  return (event, index) => {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as const)[
      event.key as 'ArrowRight'
    ];
    if (step === undefined) return;
    event.preventDefault();
    const next = ids[(index + step + ids.length) % ids.length]!;
    onPick(next);
    const group = (event.currentTarget as HTMLElement).parentElement;
    queueMicrotask(() => group?.querySelector<HTMLElement>(`[${attribute}="${next}"]`)?.focus());
  };
}

/** The accent: the presets as swatches, then any colour. */
export function accentChooser(accent: string, onPick: (accent: string) => void): TemplateResult {
  const preset = KT_ACCENTS.find((choice) => choice.id === accent);
  const custom = preset ? null : accent;
  const focusable = preset?.id ?? KT_ACCENTS[0]!.id;
  const onKeyDown = arrows(
    KT_ACCENTS.map((choice) => choice.id),
    'data-accent-id',
    onPick,
  );

  return html`<div class="accent-panel">
    <div class="accent-swatches" role="radiogroup" aria-label="Accent">
      ${KT_ACCENTS.map(
        (choice, index) =>
          html`<button
            type="button"
            class="accent-swatch"
            role="radio"
            data-accent-id=${choice.id}
            aria-label=${choice.label}
            aria-checked=${choice.id === preset?.id ? 'true' : 'false'}
            tabindex=${choice.id === focusable ? 0 : -1}
            style=${`--swatch: ${choice.color}`}
            @click=${() => onPick(choice.id)}
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
          .value=${custom ?? preset?.color ?? KT_ACCENTS[0]!.color}
          @input=${(event: Event) => onPick((event.target as HTMLInputElement).value)}
        />
      </span>
      <span class="accent-custom-label">Custom colour</span>
      ${custom ? html`<code>${custom}</code>` : ''}
    </label>
  </div>`;
}

/** The fonts, each name set in its own face. */
export function fontChooser(font: KtFont, onPick: (font: KtFont) => void): TemplateResult {
  const onKeyDown = arrows(
    KT_FONTS.map((choice) => choice.id),
    'data-font-id',
    onPick,
  );
  return html`<div class="font-choices" role="radiogroup" aria-label="Font">
    ${KT_FONTS.map(
      (choice, index) =>
        html`<button
          type="button"
          class="font-choice"
          role="radio"
          data-font-id=${choice.id}
          aria-checked=${choice.id === font ? 'true' : 'false'}
          tabindex=${choice.id === font ? 0 : -1}
          style=${`font-family: ${choice.family}`}
          @click=${() => onPick(choice.id)}
          @keydown=${(event: KeyboardEvent) => onKeyDown(event, index)}
        >
          ${choice.label}
          ${choice.id === font ? html`<kt-icon name="check" size="16"></kt-icon>` : ''}
        </button>`,
    )}
  </div>`;
}

/** A setting with a few short choices, as a segmented control. */
export function segmented<T extends string>(
  label: string,
  list: readonly { id: T; label: string }[],
  value: T,
  onPick: (id: T) => void,
): TemplateResult {
  return html`<kt-segmented-control
    size="small"
    label=${label}
    .options=${list.map(({ id, label: text }) => ({ value: id, label: text }))}
    .value=${value}
    @kt-change=${(event: CustomEvent<{ value: T }>) => onPick(event.detail.value)}
  ></kt-segmented-control>`;
}

export function customiseMenu(
  current: DocsAppearance,
  onChange: (next: DocsAppearance) => void,
  onOpen?: () => void,
): TemplateResult {
  const set = (patch: Partial<DocsAppearance>) => onChange({ ...current, ...patch });
  const section = (heading: string, body: TemplateResult) =>
    html`<div class="customise-section">
      <p class="customise-heading">${heading}</p>
      ${body}
    </div>`;

  return html`<kt-dropdown align="end" class="customise-menu" @kt-open=${() => onOpen?.()}>
    <kt-button
      slot="trigger"
      size="small"
      variant="secondary-no-bg"
      icon="sliders-horizontal"
      label="Customise"
      ><span class="customise-text">Customise</span></kt-button
    >
    <div slot="panel" class="customise-panel">
      ${section(
        'Theme',
        segmented('Theme', KT_THEMES, current.theme, (theme) => set({ theme })),
      )}
      ${section(
        'Accent',
        accentChooser(current.accent, (accent) => set({ accent })),
      )}
      ${section(
        'Font',
        fontChooser(current.font, (font) => set({ font })),
      )}
      ${section(
        'Corners',
        segmented('Corners', KT_RADII, current.radius, (radius) => set({ radius })),
      )}
      ${section(
        'Density',
        segmented('Density', KT_DENSITIES, current.density, (density) => set({ density })),
      )}
      ${section(
        'Text size',
        segmented('Text size', KT_TEXT_SIZES, current.textSize, (textSize) => set({ textSize })),
      )}
      <kt-button
        class="customise-reset"
        size="small"
        variant="text"
        @click=${() => onChange({ ...KT_DEFAULT_APPEARANCE })}
        >Reset to Kanto</kt-button
      >
    </div>
  </kt-dropdown>`;
}
