/**
 * The appearance: theme, accent, font, corners, density and text size, as
 * the data attributes the token layer reads.
 */
import { KT_ACCENTS, parseColor, setAccent } from './accent.js';

export type KtTheme = 'dark' | 'light' | 'auto';
export type KtFont = 'kanto' | 'system' | 'inter' | 'plex' | 'geist';
export type KtRadius = 'sharp' | 'default' | 'round';
export type KtDensity = 'compact' | 'default' | 'comfortable';
export type KtTextSize = 'small' | 'default' | 'large';

/** Every setting is optional: setAppearance changes only those given. */
export interface KtAppearance {
  theme?: KtTheme;
  /** A preset id from `KT_ACCENTS`, or any colour `setAccent` reads. */
  accent?: string;
  font?: KtFont;
  radius?: KtRadius;
  density?: KtDensity;
  textSize?: KtTextSize;
}

interface KtChoice<T extends string> {
  readonly id: T;
  readonly label: string;
}

export const KT_THEMES: readonly KtChoice<KtTheme>[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'auto', label: 'Auto' },
];

/** The fonts, each with the stack it sets — for showing a name in its face. */
export const KT_FONTS: readonly (KtChoice<KtFont> & { readonly family: string })[] = [
  { id: 'kanto', label: 'Kanto', family: "'Mulish', system-ui, sans-serif" },
  {
    id: 'system',
    label: 'System',
    family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  { id: 'inter', label: 'Inter', family: "'Inter', system-ui, sans-serif" },
  { id: 'plex', label: 'IBM Plex Sans', family: "'IBM Plex Sans', system-ui, sans-serif" },
  { id: 'geist', label: 'Geist', family: "'Geist', system-ui, sans-serif" },
];

export const KT_RADII: readonly KtChoice<KtRadius>[] = [
  { id: 'sharp', label: 'Sharp' },
  { id: 'default', label: 'Default' },
  { id: 'round', label: 'Round' },
];

export const KT_DENSITIES: readonly KtChoice<KtDensity>[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'default', label: 'Default' },
  { id: 'comfortable', label: 'Comfortable' },
];

export const KT_TEXT_SIZES: readonly KtChoice<KtTextSize>[] = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
];

export const KT_DEFAULT_APPEARANCE: Required<KtAppearance> = {
  theme: 'dark',
  accent: 'violet',
  font: 'kanto',
  radius: 'default',
  density: 'default',
  textSize: 'default',
};

/** Each attribute-backed setting, by its `dataset` key (`textSize` is `data-text-size`). */
const CHOICES = {
  theme: KT_THEMES,
  font: KT_FONTS,
  radius: KT_RADII,
  density: KT_DENSITIES,
  textSize: KT_TEXT_SIZES,
} as const;
type Keyed = keyof typeof CHOICES;
const KEYS = Object.keys(CHOICES) as Keyed[];

const ids = (key: Keyed) => CHOICES[key].map((choice) => choice.id as string);

/**
 * Applies `appearance` to `root` — the page by default. A setting at its
 * default removes its attribute. Everything is checked first, so an unknown
 * value throws a TypeError with nothing changed.
 */
export function setAppearance(
  appearance: KtAppearance,
  root: HTMLElement = document.documentElement,
): void {
  for (const key of KEYS) {
    const value = appearance[key];
    if (value !== undefined && !ids(key).includes(value)) {
      throw new TypeError(`Unknown ${key} "${value}". Use one of: ${ids(key).join(', ')}.`);
    }
  }
  const preset = KT_ACCENTS.find((accent) => accent.id === appearance.accent);
  if (appearance.accent !== undefined && !preset) parseColor(appearance.accent);

  for (const key of KEYS) {
    const value = appearance[key];
    if (value === undefined) continue;
    if (value === KT_DEFAULT_APPEARANCE[key]) delete root.dataset[key];
    else root.dataset[key] = value;
  }
  if (appearance.accent === undefined) return;
  if (preset) {
    setAccent(null, root);
    if (preset.id === KT_DEFAULT_APPEARANCE.accent) delete root.dataset['accent'];
    else root.dataset['accent'] = preset.id;
  } else {
    delete root.dataset['accent'];
    setAccent(appearance.accent, root);
  }
}

/** The appearance `root` shows: its attributes, with defaults for the rest. */
export function readAppearance(
  root: HTMLElement = document.documentElement,
): Required<KtAppearance> {
  const read = { ...KT_DEFAULT_APPEARANCE } as Record<keyof KtAppearance, string>;
  for (const key of KEYS) {
    const value = root.dataset[key];
    if (value !== undefined && ids(key).includes(value)) read[key] = value;
  }
  const custom = root.style.getPropertyValue('--accent-base').trim();
  const preset = root.dataset['accent'];
  if (custom) read.accent = custom;
  else if (preset && KT_ACCENTS.some((accent) => accent.id === preset)) read.accent = preset;
  return read as Required<KtAppearance>;
}
