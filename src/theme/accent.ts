/**
 * The accent colour: one colour in, every input the token layer reads out,
 * each at the contrast Kanto promises.
 *
 * Self-contained on purpose — no imports — so `scripts/generate-accents.js`
 * runs it straight from source under Node.
 */

/** An sRGB colour, each channel 0–255. */
export type KtRgb = readonly [number, number, number];
type Oklch = readonly [number, number, number]; // L 0–1, C, H in degrees

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) =>
  255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklch([r, g, b]: KtRgb): Oklch {
  const [R, G, B] = [r, g, b].map(toLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}

/** Unclamped: a channel outside 0–255 means the colour is outside sRGB. */
function fromOklch([L, C, H]: Oklch): KtRgb {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const inGamut = (rgb: KtRgb) => rgb.every((c) => c >= -0.5 && c <= 255.5);

/** The most chroma sRGB holds at this lightness and hue, up to `limit`. */
function fitChroma(L: number, H: number, limit: number): number {
  if (inGamut(fromOklch([L, limit, H]))) return limit;
  let low = 0;
  let high = limit;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (inGamut(fromOklch([L, mid, H]))) low = mid;
    else high = mid;
  }
  return low;
}

const round255 = (rgb: KtRgb): KtRgb =>
  rgb.map((c) => Math.min(255, Math.max(0, Math.round(c)))) as unknown as KtRgb;

function luminance(rgb: KtRgb): number {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two colours. */
export function contrastRatio(a: KtRgb, b: KtRgb): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

/** `top` at `alpha` over `bottom`, blended in sRGB as browsers paint it. */
const over = (top: KtRgb, alpha: number, bottom: KtRgb): KtRgb =>
  top.map((c, i) => c * alpha + bottom[i]! * (1 - alpha)) as unknown as KtRgb;

const hex = (rgb: KtRgb) =>
  `#${round255(rgb)
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;

/** Reads `#rgb`, `#rrggbb`, `rgb()`/`rgba()` and `oklch()`; throws on anything else. */
export function parseColor(input: string): KtRgb {
  const text = input.trim().toLowerCase();
  let match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text);
  if (match) {
    const digits = match[1]!.length === 3 ? [...match[1]!].map((d) => d + d).join('') : match[1]!;
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as unknown as KtRgb;
  }
  match =
    /^rgba?\(\s*(\d*\.?\d+)[\s,]+(\d*\.?\d+)[\s,]+(\d*\.?\d+)(?:\s*[,/]\s*\d*\.?\d+%?)?\s*\)$/.exec(
      text,
    );
  if (match) {
    const rgb = match.slice(1, 4).map(Number) as unknown as KtRgb;
    if (rgb.every((c) => c <= 255)) return rgb;
  }
  match =
    /^oklch\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)\s+(\d*\.?\d+)(?:deg)?\s*(?:\/\s*\d*\.?\d+%?\s*)?\)$/.exec(
      text,
    );
  if (match) {
    const L = Number(match[1]) / (match[2] ? 100 : 1);
    const H = Number(match[4]);
    if (L <= 1) return round255(fromOklch([L, fitChroma(L, H, Number(match[3])), H]));
  }
  throw new TypeError(`Not a colour Kanto can read: "${input}". Use #rrggbb, rgb() or oklch().`);
}

/** What the token layer reads for an accent. */
export interface KtAccentPalette {
  /** Solid fill; carries white text at 4.5:1 or more. */
  readonly base: string;
  /** Fill on hover, a step darker. */
  readonly hover: string;
  /** The accent as text or an icon in the dark theme. */
  readonly textDark: string;
  /** The accent as text or an icon in the light theme. */
  readonly textLight: string;
  /** The translucent wash behind secondary buttons on hover: the fill at 16%. */
  readonly wash: string;
  /** The hue, in degrees, the neutral ramp is tinted with. */
  readonly neutralHue: number;
  /** How much of the ramp's tint to keep: 0 for a grey accent, 1 for a vivid one. */
  readonly neutralChroma: number;
}

/** The violet Kanto ships, as literal values: what the tokens fall back to. */
export const KT_DEFAULT_ACCENT: KtAccentPalette = {
  base: '#5f5dea',
  hover: '#5856e0',
  textDark: '#8e97ff',
  textLight: '#4f30ef',
  wash: 'rgba(111, 116, 246, 0.16)',
  neutralHue: 278,
  neutralChroma: 1,
};

/** The presets `accents.css` carries, each from a reference colour. */
export const KT_ACCENTS: readonly { id: string; label: string; color: string }[] = [
  { id: 'violet', label: 'Violet', color: '#5f5dea' },
  { id: 'blue', label: 'Blue', color: '#1f6feb' },
  { id: 'teal', label: 'Teal', color: '#0d9488' },
  { id: 'green', label: 'Green', color: '#16a34a' },
  { id: 'orange', label: 'Orange', color: '#ea580c' },
  { id: 'pink', label: 'Pink', color: '#db2777' },
  { id: 'slate', label: 'Slate', color: '#64748b' },
];

/** The neutral steps text reads on, as [L, C, hue offset] — `--color-dark-20` per theme. */
const DARK_GROUND: Oklch = [0.3074, 0.018, 16.5];
const LIGHT_GROUNDS: Oklch[] = [
  [1, 0, 0],
  [0.9023, 0.0081, 8.2],
];
const WHITE_TEXT: KtRgb = [244, 244, 245];
/** 4.5:1, with room for the rounding to hex and the browser's own. */
const TARGET = 4.6;

/** Every token input for `color`, solved in OKLCH for the contrast Kanto promises. */
export function accentPalette(color: string): KtAccentPalette {
  const [inL, inC, inH] = toOklch(parseColor(color));
  const hue = inC < 0.0005 ? 0 : inH;
  const neutralChroma = Math.round(Math.min(1, inC / 0.08) * 100) / 100;
  const at = (L: number): KtRgb => fromOklch([L, fitChroma(L, hue, inC), hue]);
  const ground = ([L, C, offset]: Oklch): KtRgb => fromOklch([L, C * neutralChroma, hue + offset]);

  // The lightest fill, at or below the colour's own lightness, that white reads on.
  let baseL = Math.min(inL, 0.72);
  while (baseL > 0 && contrastRatio(WHITE_TEXT, at(baseL)) < TARGET) baseL -= 0.0025;
  const base = at(baseL);

  // Dark theme text: the darkest step that reads, which keeps the most colour.
  // Accent text sits on the surfaces, on its own 12% tint and on the 16%
  // wash behind a hovered secondary button.
  const tints = (g: KtRgb) => [g, over(base, 0.12, g), over(base, 0.16, g)];
  const darkGrounds = tints(ground(DARK_GROUND));
  let darkL = 0.45;
  while (darkL < 1 && darkGrounds.some((g) => contrastRatio(at(darkL), g) < TARGET)) {
    darkL += 0.0025;
  }

  // Light theme text: the lightest step that reads.
  const lightGrounds = LIGHT_GROUNDS.map(ground).flatMap(tints);
  let lightL = 0.7;
  while (lightL > 0 && lightGrounds.some((g) => contrastRatio(at(lightL), g) < TARGET)) {
    lightL -= 0.0025;
  }

  const [r, g, b] = round255(base);
  return {
    base: hex(base),
    hover: hex(at(Math.max(0, baseL - 0.025))),
    textDark: hex(at(darkL)),
    textLight: hex(at(lightL)),
    wash: `rgba(${r}, ${g}, ${b}, 0.16)`,
    neutralHue: Math.round(hue * 10) / 10,
    neutralChroma,
  };
}

/** The custom properties a palette sets — what `accents.css` and `setAccent` write. */
export function accentProperties(palette: KtAccentPalette): Record<string, string> {
  return {
    '--accent-base': palette.base,
    '--accent-hover': palette.hover,
    '--accent-text-dark': palette.textDark,
    '--accent-text-light': palette.textLight,
    '--accent-wash': palette.wash,
    '--neutral-hue': String(palette.neutralHue),
    '--neutral-chroma': String(palette.neutralChroma),
  };
}

const INPUTS = Object.keys(accentProperties(KT_DEFAULT_ACCENT));

/**
 * Themes `root` — the page by default — with any colour; `null` takes it off,
 * back to the `data-accent` preset or the default.
 *
 * The inputs go on as inline custom properties. The element also needs a
 * `data-accent` attribute for the token layer to re-read them there: a preset
 * already on it is kept, otherwise it gets `data-accent="custom"`.
 */
export function setAccent(
  color: string | null,
  root: HTMLElement = document.documentElement,
): void {
  if (color === null) {
    for (const name of INPUTS) root.style.removeProperty(name);
    if (root.dataset['accent'] === 'custom') delete root.dataset['accent'];
    return;
  }
  for (const [name, value] of Object.entries(accentProperties(accentPalette(color)))) {
    root.style.setProperty(name, value);
  }
  // A preset already there stays: the inline inputs win over it, and it is
  // what setAccent(null) goes back to.
  root.dataset['accent'] ??= 'custom';
}
