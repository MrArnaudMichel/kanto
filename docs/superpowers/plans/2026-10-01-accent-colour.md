# Accent colour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Kanto's primary colour be changed — to a tuned preset or any colour — with contrast guaranteed, and let docs-site visitors try it from a chooser left of the theme switch.

**Architecture:** The public colour tokens stop holding literals and read a few
inputs (`--accent-*`, `--neutral-*`) with today's values as fallbacks. Presets
are CSS blocks setting those inputs (`data-accent="blue"`); a pure function
`accentPalette(color)` solves the inputs for any colour in OKLCH, and
`setAccent()` writes them inline. The docs site's chooser uses both.

**Tech Stack:** CSS custom properties, `oklch()`, `color-mix()`; TypeScript;
Lit (docs site); Vitest (unit = happy-dom, browser = Playwright Chromium).

**Spec:** `docs/superpowers/specs/2026-10-01-accent-colour-design.md`

## Global Constraints

- Commits in Arnaud Michel's name only, **no Co-Authored-By / Claude trailer**.
- TDD: write the failing test, watch it fail, implement, watch it pass.
- `npm run verify` passes before every commit (move any scratch `zz-*` files out of the repo first — Prettier flags them).
- Public token names do not change.
- Default rendering unchanged: every colour token computes, in both themes, to today's value within 1 sRGB unit per channel.
- Contrast: white on `--color-primary-base` ≥ 4.5:1; `--color-primary-text` ≥ 4.5:1 on the surfaces up to `--color-dark-20` and on its own 12% tint, in both themes.
- Never name a class member after an `HTMLElement` member (`title`, `remove`, `hidden`…).
- No push, no release.

## Review Focus

1. An accent on a container inside a light subtree (`<div data-theme="light"><div data-accent="green">`) must give the **light** text variant, not the dark one — Task 2 pins it.
2. A grey or near-grey custom colour must give grey neutrals and still meet contrast — Task 1 pins it.
3. A bright colour (yellow `#facc15`) must still carry white text at 4.5:1 — Task 1 pins it (base darkened).
4. Choosing a preset after a custom colour must drop the custom inline properties — Task 3 (`setAccent(null)`) and Task 4 (chooser) pin it.
5. A corrupt or blocked `localStorage` value must leave the docs site on violet without throwing — Task 4 pins it.

---

## File structure

| File                                                                                   | Responsibility                                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/theme/accent.ts` (create)                                                         | Colour maths, `parseColor`, `contrastRatio`, `accentPalette`, `accentProperties`, `setAccent`, `KT_ACCENTS`, `KT_DEFAULT_ACCENT`. **No imports**, so Node can run it from source. |
| `src/theme/accent.test.ts` (create)                                                    | Unit tests of the maths and the parser.                                                                                                                                           |
| `src/tokens/colors.css` (modify)                                                       | Inputs with fallbacks; neutral ramp in `oklch()`; selector `:root, [data-accent]`.                                                                                                |
| `src/tokens/theme-light.css` (modify)                                                  | Same for the light blocks; selectors extended to `[data-accent]` descendants.                                                                                                     |
| `src/tokens/accents.css` (create, generated)                                           | The seven presets.                                                                                                                                                                |
| `scripts/generate-accents.js` (create)                                                 | Writes `accents.css` from `accent.ts`.                                                                                                                                            |
| `src/tokens/accents.test.ts` (create)                                                  | `accents.css` matches the generator's output.                                                                                                                                     |
| `src/tokens/tokens.browser.test.ts` (create)                                           | Default unchanged; presets, subtree and theme switch in a real browser.                                                                                                           |
| `src/theme/accent.browser.test.ts` (create)                                            | `setAccent` in a real browser.                                                                                                                                                    |
| `src/tokens/index.css` (modify)                                                        | Imports `accents.css`.                                                                                                                                                            |
| `src/index.ts` (modify)                                                                | Exports the accent API.                                                                                                                                                           |
| `demo/lib/accent.ts` (create)                                                          | Docs-site chooser: storage, apply, render.                                                                                                                                        |
| `demo/lib/accent.test.ts` (create)                                                     | Chooser unit tests.                                                                                                                                                               |
| `demo/main.ts`, `demo/shell.css` (modify)                                              | Chooser in the top bar; apply before first render.                                                                                                                                |
| `src/tokens/README.md`, `demo/pages/guide.ts`, `demo/main.ts`, `CHANGELOG.md` (modify) | Docs.                                                                                                                                                                             |

---

### Task 1: The accent maths — `src/theme/accent.ts`

**Files:**

- Create: `src/theme/accent.ts`
- Test: `src/theme/accent.test.ts`
- Modify: `src/index.ts` (exports)

**Interfaces:**

- Produces:
  - `type KtRgb = readonly [number, number, number]` (sRGB 0–255)
  - `parseColor(input: string): KtRgb` — throws `TypeError` on unreadable input
  - `contrastRatio(a: KtRgb, b: KtRgb): number`
  - `interface KtAccentPalette { base; hover; textDark; textLight; wash: string; neutralHue: number; neutralChroma: number }`
  - `accentPalette(color: string): KtAccentPalette`
  - `KT_DEFAULT_ACCENT: KtAccentPalette` (today's violet, literal)
  - `KT_ACCENTS: readonly { id: string; label: string; color: string }[]`
  - `accentProperties(palette: KtAccentPalette): Record<string, string>` — the `--accent-*`/`--neutral-*` map
  - `setAccent(color: string | null, root?: HTMLElement): void`

- [ ] **Step 1: Write the failing tests**

`src/theme/accent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  accentPalette,
  accentProperties,
  contrastRatio,
  KT_ACCENTS,
  KT_DEFAULT_ACCENT,
  parseColor,
  setAccent,
} from './accent.js';

/** The surfaces text sits on, rebuilt the way the CSS builds them. */
function grounds(palette: ReturnType<typeof accentPalette>) {
  const surface = (L: number, C: number, offset: number) =>
    parseColor(
      `oklch(${L} ${C * palette.neutralChroma} ${(palette.neutralHue + offset + 360) % 360})`,
    );
  const base = parseColor(palette.base);
  const tint = (ground: readonly number[]) =>
    ground.map((c, i) => Math.round(base[i]! * 0.12 + c * 0.88)) as unknown as typeof base;
  const dark20 = surface(0.3074, 0.018, 16.5);
  const light20 = surface(0.9023, 0.0081, 8.2);
  const white = [255, 255, 255] as const;
  return {
    dark: [dark20, tint(dark20)],
    light: [white, light20, tint(white), tint(light20)],
  };
}

function expectReadable(color: string) {
  const palette = accentPalette(color);
  expect(contrastRatio([244, 244, 245], parseColor(palette.base))).toBeGreaterThanOrEqual(4.5);
  const { dark, light } = grounds(palette);
  for (const ground of dark) {
    expect(contrastRatio(parseColor(palette.textDark), ground)).toBeGreaterThanOrEqual(4.5);
  }
  for (const ground of light) {
    expect(contrastRatio(parseColor(palette.textLight), ground)).toBeGreaterThanOrEqual(4.5);
  }
}

describe('parseColor', () => {
  it('reads hex, rgb() and oklch()', () => {
    expect(parseColor('#5f5dea')).toEqual([95, 93, 234]);
    expect(parseColor('#FFF')).toEqual([255, 255, 255]);
    expect(parseColor('rgb(30, 136, 229)')).toEqual([30, 136, 229]);
    expect(parseColor('rgba(30 136 229 / 0.5)')).toEqual([30, 136, 229]);
    expect(parseColor('oklch(1 0 0)')).toEqual([255, 255, 255]);
    expect(parseColor('oklch(62.8% 0.2577 29.23)')).toEqual([255, 0, 0]);
  });

  it('turns down what it cannot read', () => {
    for (const bad of ['blue', '#12345', 'rgb(300, 0, 0)', 'hsl(0 100% 50%)', '']) {
      expect(() => parseColor(bad)).toThrow(TypeError);
    }
  });
});

describe('accentPalette', () => {
  it('keeps the hue it was given', () => {
    expect(accentPalette('#16a34a').neutralHue).toBeCloseTo(149.2, 0);
    expect(accentPalette('#1f6feb').neutralHue).toBeCloseTo(259.7, 0);
  });

  it('lands close to the violet Kanto ships', () => {
    const violet = accentPalette('#5f5dea');
    const near = (a: string, b: string) =>
      parseColor(a).every((c, i) => Math.abs(c - parseColor(b)[i]!) <= 3);
    expect(near(violet.base, KT_DEFAULT_ACCENT.base)).toBe(true);
    expect(near(violet.textDark, KT_DEFAULT_ACCENT.textDark)).toBe(true);
  });

  it('meets contrast on every preset', () => {
    for (const accent of KT_ACCENTS) expectReadable(accent.color);
  });

  it('meets contrast round the whole wheel, at every chroma and lightness', () => {
    for (let hue = 0; hue < 360; hue += 15) {
      for (const chroma of [0, 0.05, 0.12, 0.25]) {
        for (const lightness of [0.35, 0.55, 0.75, 0.92]) {
          expectReadable(`oklch(${lightness} ${chroma} ${hue})`);
        }
      }
    }
  });

  it('darkens a bright yellow until white reads on it', () => {
    const yellow = accentPalette('#facc15');
    expect(contrastRatio([244, 244, 245], parseColor(yellow.base))).toBeGreaterThanOrEqual(4.5);
  });

  it('greys the neutrals for a grey accent', () => {
    expect(accentPalette('#808080').neutralChroma).toBe(0);
    expect(accentPalette('#64748b').neutralChroma).toBeGreaterThan(0);
    expect(accentPalette('#64748b').neutralChroma).toBeLessThan(1);
    expect(accentPalette('#5f5dea').neutralChroma).toBe(1);
  });
});

describe('accentProperties', () => {
  it('names every input the token layer reads', () => {
    expect(Object.keys(accentProperties(KT_DEFAULT_ACCENT)).sort()).toEqual([
      '--accent-base',
      '--accent-hover',
      '--accent-text-dark',
      '--accent-text-light',
      '--accent-wash',
      '--neutral-chroma',
      '--neutral-hue',
    ]);
  });
});

describe('setAccent', () => {
  it('writes the inputs on the root, and takes them off again', () => {
    const root = document.createElement('div');
    setAccent('#16a34a', root);
    expect(root.style.getPropertyValue('--accent-base')).toBe(accentPalette('#16a34a').base);
    expect(root.dataset['accent']).toBe('custom');

    setAccent(null, root);
    expect(root.getAttribute('style') ?? '').not.toContain('--accent');
    expect(root.hasAttribute('data-accent')).toBe(false);
  });

  it('leaves a preset attribute alone when cleared', () => {
    const root = document.createElement('div');
    root.dataset['accent'] = 'blue';
    setAccent(null, root);
    expect(root.dataset['accent']).toBe('blue');
  });

  it('defaults to the document element', () => {
    setAccent('#ea580c');
    expect(document.documentElement.style.getPropertyValue('--accent-base')).not.toBe('');
    setAccent(null);
    expect(document.documentElement.style.getPropertyValue('--accent-base')).toBe('');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/theme/accent.test.ts`
Expected: FAIL — `Failed to resolve import "./accent.js"`.

- [ ] **Step 3: Write the implementation**

`src/theme/accent.ts`:

```ts
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
  match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/.exec(text);
  if (match) {
    const rgb = match.slice(1, 4).map(Number) as unknown as KtRgb;
    if (rgb.every((c) => c <= 255)) return rgb;
  }
  match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*[\d.]+%?\s*)?\)$/.exec(
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
  /** The translucent wash behind secondary buttons on hover. */
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
  const dark = ground(DARK_GROUND);
  const darkGrounds = [dark, over(base, 0.12, dark)];
  let darkL = 0.45;
  while (darkL < 1 && darkGrounds.some((g) => contrastRatio(at(darkL), g) < TARGET)) {
    darkL += 0.0025;
  }

  // Light theme text: the lightest step that reads.
  const lightGrounds = LIGHT_GROUNDS.map(ground).flatMap((g) => [g, over(base, 0.12, g)]);
  let lightL = 0.7;
  while (lightL > 0 && lightGrounds.some((g) => contrastRatio(at(lightL), g) < TARGET)) {
    lightL -= 0.0025;
  }

  const [r, g, b] = round255(at(darkL));
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
 * The inputs go on as inline custom properties, with `data-accent="custom"`
 * so the token layer re-reads them on an element other than the root.
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
  root.dataset['accent'] = 'custom';
}
```

Then export from `src/index.ts`, after the `setStrings` export block:

```ts
export {
  accentPalette,
  accentProperties,
  contrastRatio,
  KT_ACCENTS,
  KT_DEFAULT_ACCENT,
  parseColor,
  setAccent,
} from './theme/accent.js';
export type { KtAccentPalette, KtRgb } from './theme/accent.js';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/theme/accent.test.ts`
Expected: PASS, all tests. If the whole-wheel test is slow (> 5 s), it is the
24-step `fitChroma` bisection; leave it — correctness first.

- [ ] **Step 5: Verify and commit**

```bash
npm run verify
git add src/theme src/index.ts
git commit -m "feat(theme): solve an accent palette for any colour"
```

If `check:size` fails on `.`, `./react`, `./vue`: raise only those entries
(back up `size-budget.json`, run `node scripts/check-size.js --update`, copy
those three values back into the backup, restore it).

---

### Task 2: The token layer reads the inputs

**Files:**

- Modify: `src/tokens/colors.css`
- Modify: `src/tokens/theme-light.css` (both the `light` block and the `auto` block)
- Test: `src/tokens/tokens.browser.test.ts` (create)

**Interfaces:**

- Consumes: `accentPalette`, `setAccent` from Task 1 (in tests).
- Produces: the CSS inputs `--accent-base`, `--accent-hover`, `--accent-text-dark`, `--accent-text-light`, `--accent-wash`, `--neutral-hue`, `--neutral-chroma`, re-read on any `[data-accent]` element.

- [ ] **Step 1: Write the failing browser test**

`src/tokens/tokens.browser.test.ts`:

```ts
/**
 * The token layer in a real browser: oklch(), color-mix() and custom
 * properties resolve only there. Colours are read back through a canvas,
 * because getComputedStyle leaves an oklch() colour in oklch.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../styles.css';
import { accentPalette, parseColor, setAccent } from '../theme/accent.js';

const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;

/** The sRGB a token paints, on `element`. */
function paint(token: string, element: Element = document.documentElement): number[] {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  element.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = '#000';
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, 1, 1);
  return [...canvas.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

function expectNear(actual: number[], expected: readonly number[]) {
  actual.forEach((c, i) => expect(Math.abs(c - expected[i]!)).toBeLessThanOrEqual(1));
}

/** Today's values, before the token layer read any input. */
const DARK: Record<string, [number, number, number]> = {
  '--color-primary-base': [95, 93, 234],
  '--color-primary-hover': [88, 86, 224],
  '--color-primary-text': [142, 151, 255],
  '--color-text-100': [244, 244, 245],
  '--color-text-400': [169, 169, 181],
  '--color-text-500': [101, 101, 114],
  '--color-text-600': [75, 75, 88],
  '--color-text-700': [66, 66, 77],
  '--color-text-800': [58, 58, 68],
  '--color-text-900': [39, 39, 42],
  '--color-dark-8': [19, 18, 22],
  '--color-dark-12': [29, 28, 34],
  '--color-dark-14': [34, 33, 39],
  '--color-dark-15': [36, 35, 41],
  '--color-dark-16': [38, 37, 44],
  '--color-dark-18': [43, 42, 50],
  '--color-dark-19': [45, 44, 53],
  '--color-dark-20': [48, 46, 56],
  '--color-dark-22': [53, 51, 61],
  '--color-dark-23': [55, 53, 64],
  '--color-dark-24': [58, 56, 67],
};
const LIGHT: Record<string, [number, number, number]> = {
  '--color-primary-base': [95, 93, 234],
  '--color-primary-text': [79, 48, 239],
  '--color-text-100': [28, 28, 30],
  '--color-text-400': [80, 80, 90],
  '--color-text-500': [110, 110, 120],
  '--color-text-600': [130, 130, 140],
  '--color-text-700': [155, 155, 165],
  '--color-text-800': [180, 180, 190],
  '--color-text-900': [220, 220, 225],
  '--color-dark-8': [255, 255, 255],
  '--color-dark-12': [250, 250, 252],
  '--color-dark-14': [245, 245, 247],
  '--color-dark-15': [242, 242, 245],
  '--color-dark-16': [238, 238, 241],
  '--color-dark-18': [232, 232, 236],
  '--color-dark-19': [228, 228, 233],
  '--color-dark-20': [222, 222, 228],
  '--color-dark-22': [215, 215, 222],
  '--color-dark-23': [210, 210, 218],
  '--color-dark-24': [205, 205, 212],
};

afterEach(() => {
  delete document.documentElement.dataset['theme'];
  delete document.documentElement.dataset['accent'];
  setAccent(null);
  document.body.replaceChildren();
});

describe('the default accent', () => {
  it('paints what Kanto painted before, in the dark theme', () => {
    for (const [token, rgb] of Object.entries(DARK)) expectNear(paint(token), rgb);
  });

  it('paints what Kanto painted before, in the light theme', () => {
    document.documentElement.dataset['theme'] = 'light';
    for (const [token, rgb] of Object.entries(LIGHT)) expectNear(paint(token), rgb);
  });
});

describe('a custom accent', () => {
  it('re-tints the primary and the neutrals', () => {
    setAccent('#16a34a');
    const green = accentPalette('#16a34a');
    expectNear(paint('--color-primary-base'), parseColor(green.base));
    expectNear(paint('--color-primary-text'), parseColor(green.textDark));
    const [r, g, b] = paint('--color-dark-12');
    expect(g).toBeGreaterThan(r); // greenish now, no longer violet
    expect(g).toBeGreaterThan(b);
  });

  it('switches its text step with the theme, with no new call', () => {
    setAccent('#16a34a');
    document.documentElement.dataset['theme'] = 'light';
    expectNear(paint('--color-primary-text'), parseColor(accentPalette('#16a34a').textLight));
  });

  it('themes one container and nothing outside it', () => {
    const box = document.createElement('div');
    document.body.append(box);
    setAccent('#ea580c', box);
    expectNear(paint('--color-primary-base', box), parseColor(accentPalette('#ea580c').base));
    expectNear(paint('--color-primary-base'), DARK['--color-primary-base']!);
  });

  it('gives a container inside a light subtree the light text step', () => {
    const light = document.createElement('div');
    light.dataset['theme'] = 'light';
    const box = document.createElement('div');
    light.append(box);
    document.body.append(light);
    setAccent('#16a34a', box);
    expectNear(paint('--color-primary-text', box), parseColor(accentPalette('#16a34a').textLight));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --project browser src/tokens/tokens.browser.test.ts`
Expected: the two "default" tests PASS (nothing changed yet); every "custom
accent" test FAILS (the tokens ignore `--accent-*`).

- [ ] **Step 3: Rewrite `colors.css`**

1. Change the opening selector `:root {` to `:root,\n[data-accent] {` and
   add above it:

```css
/* The accent and the tint of the neutrals are inputs: set them on any
   element — directly, through a data-accent preset (accents.css) or with
   setAccent() — and the tokens below follow. Each falls back to Kanto's
   violet. An element carrying data-accent re-declares the tokens, so an
   accent set on a container themes that container. */
```

2. Replace the BRAND primary lines and `--color-secondary-hover`:

```css
--color-primary-base: var(--accent-base, rgba(95, 93, 234, 1));
--color-primary-hover: var(--accent-hover, rgba(88, 86, 224, 1));
--color-primary-soft: color-mix(in srgb, var(--color-primary-base) 12%, transparent);
--color-secondary-hover: var(--accent-wash, rgba(111, 116, 246, 0.16));
```

3. Replace `--color-primary-text: #8e97ff;` with
   `--color-primary-text: var(--accent-text-dark, #8e97ff);`

4. Replace each `--color-text-*` and `--color-dark-*` declaration with:

```css
/* === TEXT (100 = highest contrast) ===
     Neutral, tinted by the accent: each step keeps its lightness and chroma
     and sits at a fixed offset from --neutral-hue, so the default reproduces
     the ramp Kanto shipped to within a tenth of an sRGB unit. */
--color-text-100: oklch(
  0.9674 calc(0.0013 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.4)
);
/* 4.5:1 on every surface up to --color-dark-24, and on the tinted alerts. */
--color-text-400: oklch(
  0.7386 calc(0.0171 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8)
);
--color-text-500: oklch(
  0.5113 calc(0.0204 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.7)
);
--color-text-600: oklch(
  0.4178 calc(0.0215 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.4)
);
--color-text-700: oklch(
  0.3833 calc(0.0186 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.5)
);
--color-text-800: oklch(
  0.3524 calc(0.0172 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.5)
);
--color-text-900: oklch(
  0.2739 calc(0.0055 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8)
);

/* === SURFACES (low → high elevation) === */
--color-dark-8: oklch(
  0.1852 calc(0.0082 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 19)
);
--color-dark-12: oklch(
  0.2302 calc(0.0115 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 15.1)
);
--color-dark-14: oklch(
  0.2514 calc(0.0113 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 15.2)
);
--color-dark-15: oklch(
  0.2597 calc(0.0112 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 15.3)
);
--color-dark-16: oklch(
  0.2685 calc(0.0129 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 14.1)
);
--color-dark-18: oklch(
  0.2894 calc(0.0145 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 13.2)
);
--color-dark-19: oklch(
  0.2979 calc(0.0162 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 12.5)
);
--color-dark-20: oklch(
  0.3074 calc(0.018 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 16.5)
);
--color-dark-22: oklch(
  0.3271 calc(0.0177 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 16.6)
);
--color-dark-23: oklch(
  0.3354 calc(0.0193 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 15.7)
);
--color-dark-24: oklch(
  0.3471 calc(0.0191 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 15.7)
);
```

- [ ] **Step 4: Rewrite `theme-light.css`**

1. Extend both selectors:

```css
:root[data-theme='light'],
[data-theme='light'],
[data-theme='light'] [data-accent] {
```

and inside the media query:

```css
  :root[data-theme='auto'],
  [data-theme='auto'],
  [data-theme='auto'] [data-accent] {
```

2. In **both** blocks replace `--color-primary-text: #4f30ef;` with
   `--color-primary-text: var(--accent-text-light, #4f30ef);`

3. In **both** blocks replace the `--color-text-*` and `--color-dark-12…24`
   lines (keep `--color-dark-8: rgba(255, 255, 255, 1);` — white has no hue):

```css
--color-text-100: oklch(
  0.2273 calc(0.0038 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.1)
);
--color-text-400: oklch(
  0.4349 calc(0.0163 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.7)
);
--color-text-500: oklch(
  0.5416 calc(0.0154 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.9)
);
--color-text-600: oklch(
  0.6099 calc(0.015 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 7.9)
);
--color-text-700: oklch(
  0.6927 calc(0.0145 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8)
);
--color-text-800: oklch(
  0.773 calc(0.0141 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.1)
);
--color-text-900: oklch(
  0.8959 calc(0.0068 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.3)
);
```

```css
--color-dark-12: oklch(
  0.9857 calc(0.0026 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.4)
);
--color-dark-14: oklch(
  0.9707 calc(0.0027 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.4)
);
--color-dark-15: oklch(
  0.962 calc(0.004 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.3)
);
--color-dark-16: oklch(
  0.95 calc(0.004 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.3)
);
--color-dark-18: oklch(
  0.9321 calc(0.0054 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.3)
);
--color-dark-19: oklch(
  0.9203 calc(0.0067 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.3)
);
--color-dark-20: oklch(
  0.9023 calc(0.0081 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.2)
);
--color-dark-22: oklch(
  0.8812 calc(0.0095 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.2)
);
--color-dark-23: oklch(
  0.8661 calc(0.0109 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.2)
);
--color-dark-24: oklch(
  0.8504 calc(0.0096 * var(--neutral-chroma, 1)) calc(var(--neutral-hue, 278) + 8.2)
);
```

4. Run `npx prettier --write src/tokens/*.css` (it wraps the long lines).

- [ ] **Step 5: Run the token test and the shared suites**

Run: `npx vitest run --project browser src/tokens/tokens.browser.test.ts src/components/a11y.browser.test.ts`
Expected: PASS. Then `npx vitest run src/tokens` (the unit `base.test.ts`
reads these files) — PASS. If a unit test asserts a token is a hex/rgba
literal, update its expectation to the new form and say why in the commit.

- [ ] **Step 6: Look at it**

Screenshot the docs site (`npx vite --config demo/vite.config.ts --port 5199 --strictPort --force`; stop with `fuser -k 5199/tcp`) in both themes before and after: no visible change. Then with
`document.documentElement.style.setProperty('--neutral-hue', '149')` in the
console: greenish greys.

- [ ] **Step 7: Verify and commit**

```bash
npm run verify
git add src/tokens
git commit -m "feat(tokens): derive the primary and the neutrals from accent inputs"
```

---

### Task 3: Presets — `accents.css` and its generator

**Files:**

- Create: `scripts/generate-accents.js`
- Create: `src/tokens/accents.css` (generated)
- Modify: `src/tokens/index.css` (import it after `theme-light.css`)
- Test: `src/tokens/accents.test.ts` (create); add a case to `src/tokens/tokens.browser.test.ts`

**Interfaces:**

- Consumes: `KT_ACCENTS`, `KT_DEFAULT_ACCENT`, `accentPalette`, `accentProperties` (Task 1).
- Produces: `[data-accent='<id>']` for each id in `KT_ACCENTS`; `accentsCss(): string` exported by the script.

- [ ] **Step 1: Write the failing tests**

`src/tokens/accents.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accentsCss } from '../../scripts/generate-accents.js';
import { KT_ACCENTS } from '../theme/accent.js';

const file = readFileSync(new URL('./accents.css', import.meta.url), 'utf8');

describe('accents.css', () => {
  it('is what the generator writes — run node scripts/generate-accents.js', () => {
    expect(file).toBe(accentsCss());
  });

  it('has a block for every preset', () => {
    for (const { id } of KT_ACCENTS) expect(file).toContain(`[data-accent='${id}']`);
  });

  it('gives violet the literal default, so it resets a nested accent', () => {
    expect(file).toMatch(/\[data-accent='violet'\] \{\n {2}--accent-base: #5f5dea;/);
  });
});
```

Add to `src/tokens/tokens.browser.test.ts`, inside `describe('a custom accent', …)`:

```ts
it('takes a preset from data-accent', () => {
  document.documentElement.dataset['accent'] = 'blue';
  expectNear(paint('--color-primary-base'), parseColor(accentPalette('#1f6feb').base));
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/tokens/accents.test.ts`
Expected: FAIL — cannot resolve `../../scripts/generate-accents.js`.

- [ ] **Step 3: Write the generator**

`scripts/generate-accents.js`:

```js
/**
 * Writes src/tokens/accents.css: one block of accent inputs per preset in
 * KT_ACCENTS, solved by accentPalette. The presets cost a page no script;
 * this keeps them in step with the function a custom colour goes through.
 *
 *     node scripts/generate-accents.js
 *
 * accent.ts has no imports, so Node runs it from source.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  accentPalette,
  accentProperties,
  KT_ACCENTS,
  KT_DEFAULT_ACCENT,
} from '../src/theme/accent.ts';

const HEADER = `/**
 * Accent presets — generated by scripts/generate-accents.js; do not edit.
 *
 * Set one on the page or on any container:
 *
 *     <html data-accent="blue">
 *
 * Each block sets the inputs colors.css reads. Violet is Kanto's default,
 * spelled out so it can reset a container inside another accent.
 */
`;

export function accentsCss() {
  const blocks = KT_ACCENTS.map(({ id, color }) => {
    const palette = id === 'violet' ? KT_DEFAULT_ACCENT : accentPalette(color);
    const lines = Object.entries(accentProperties(palette)).map(
      ([name, value]) => `  ${name}: ${value};`,
    );
    return `[data-accent='${id}'] {\n${lines.join('\n')}\n}\n`;
  });
  return `${HEADER}\n${blocks.join('\n')}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../src/tokens/accents.css', import.meta.url), accentsCss());
}
```

If Vitest cannot import a `.ts` path from a `.js` file, keep the import as is
— Vite resolves `.ts` — and check that `node scripts/generate-accents.js`
also works (Node ≥ 22.18 strips types). Both must work; the repo runs Node 22.23.

- [ ] **Step 4: Generate, import, run**

```bash
node scripts/generate-accents.js
npx prettier --check src/tokens/accents.css   # must already be formatted; if not, adjust the generator's output, not the file
```

Add to `src/tokens/index.css`, after `@import './theme-light.css';`:

```css
@import './accents.css';
```

Run: `npx vitest run src/tokens/accents.test.ts && npx vitest run --project browser src/tokens/tokens.browser.test.ts`
Expected: PASS.

- [ ] **Step 5: axe under the presets**

In `src/components/a11y.browser.test.ts`, add a block that runs the existing
button/badge/link/calendar cases with `data-accent` set to `blue`, `green`,
`orange` on `<html>`, and in the light theme. Follow the file's existing
pattern for themed runs (search for `data-theme` in it); reuse the `TONES` and
`BUTTON_VARIANTS` loops rather than duplicating cases. Expected: PASS.

- [ ] **Step 6: Verify and commit**

Check `package.json` `files`/`exports` ship `src/tokens/*.css` → `dist/tokens/` (see `scripts/copy-static.js`); if the copy is a glob, nothing to do.

```bash
npm run verify
git add scripts/generate-accents.js src/tokens src/components/a11y.browser.test.ts
git commit -m "feat(tokens): add seven accent presets, set with data-accent"
```

---

### Task 4: The docs site's chooser

**Files:**

- Create: `demo/lib/accent.ts`
- Test: `demo/lib/accent.test.ts`
- Modify: `demo/main.ts` (top bar; apply before first render)
- Modify: `demo/shell.css` (swatch styles)

**Interfaces:**

- Consumes: `KT_ACCENTS`, `setAccent` from `kanto-ds` (Task 1).
- Produces:
  - `type AccentChoice = { kind: 'preset'; id: string } | { kind: 'custom'; color: string }`
  - `readAccent(): AccentChoice` — never throws; violet on anything unreadable
  - `applyAccent(choice: AccentChoice, root?: HTMLElement): void` — applies and stores
  - `accentChooser(current: AccentChoice, onPick: (choice: AccentChoice) => void): TemplateResult`

- [ ] **Step 1: Write the failing tests**

`demo/lib/accent.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'lit';
import { accentChooser, applyAccent, readAccent } from './accent.js';

const KEY = 'kanto-docs-accent';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-accent');
  document.documentElement.removeAttribute('style');
  document.body.replaceChildren();
});

describe('the docs accent', () => {
  it('is violet when nothing is stored', () => {
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
  });

  it('is violet when what is stored is not an accent', () => {
    localStorage.setItem(KEY, '{nope');
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
    localStorage.setItem(KEY, JSON.stringify({ kind: 'custom', color: 'blue' }));
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
    localStorage.setItem(KEY, JSON.stringify({ kind: 'preset', id: 'mauve' }));
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
  });

  it('is violet when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
  });

  it('applies a preset, then a custom colour, then a preset again', () => {
    const root = document.documentElement;
    applyAccent({ kind: 'preset', id: 'blue' });
    expect(root.dataset['accent']).toBe('blue');

    applyAccent({ kind: 'custom', color: '#16a34a' });
    expect(root.dataset['accent']).toBe('custom');
    expect(root.style.getPropertyValue('--accent-base')).not.toBe('');

    applyAccent({ kind: 'preset', id: 'teal' });
    expect(root.dataset['accent']).toBe('teal');
    expect(root.style.getPropertyValue('--accent-base')).toBe('');
    expect(readAccent()).toEqual({ kind: 'preset', id: 'teal' });
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => applyAccent({ kind: 'preset', id: 'green' })).not.toThrow();
    expect(document.documentElement.dataset['accent']).toBe('green');
  });
});

describe('the chooser', () => {
  function mount(current = readAccent()) {
    const onPick = vi.fn();
    render(accentChooser(current, onPick), document.body);
    const radios = [...document.body.querySelectorAll<HTMLElement>('[role="radio"]')];
    return { onPick, radios };
  }

  it('offers every preset as a named radio, the current one checked', () => {
    const { radios } = mount({ kind: 'preset', id: 'green' });
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Violet',
      'Blue',
      'Teal',
      'Green',
      'Orange',
      'Pink',
      'Slate',
    ]);
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(radios[3]!.getAttribute('aria-checked')).toBe('true');
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, -1, -1, 0, -1, -1, -1]);
  });

  it('picks a preset on click', () => {
    const { onPick, radios } = mount();
    radios[1]!.click();
    expect(onPick).toHaveBeenCalledWith({ kind: 'preset', id: 'blue' });
  });

  it('moves between presets with the arrows, picking as it goes', () => {
    const { onPick, radios } = mount({ kind: 'preset', id: 'violet' });
    radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onPick).toHaveBeenLastCalledWith({ kind: 'preset', id: 'blue' });
    radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(onPick).toHaveBeenLastCalledWith({ kind: 'preset', id: 'slate' });
  });

  it('takes a custom colour from the colour input', () => {
    const { onPick } = mount();
    const input = document.body.querySelector<HTMLInputElement>('input[type="color"]')!;
    input.value = '#16a34a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onPick).toHaveBeenCalledWith({ kind: 'custom', color: '#16a34a' });
  });

  it('shows the custom colour as checked when one is in use', () => {
    const { radios } = mount({ kind: 'custom', color: '#16a34a' });
    expect(radios.some((r) => r.getAttribute('aria-checked') === 'true')).toBe(false);
    expect(document.body.querySelector('.accent-custom')!.textContent).toContain('#16a34a');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run demo/lib/accent.test.ts`
Expected: FAIL — cannot resolve `./accent.js`.

- [ ] **Step 3: Write `demo/lib/accent.ts`**

```ts
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

  return html`<div class="accent-panel">
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
      <input
        type="color"
        .value=${current.kind === 'custom' ? current.color : accentSwatch(current)}
        @input=${(event: Event) =>
          onPick({ kind: 'custom', color: (event.target as HTMLInputElement).value })}
      />
      <span>Custom${current.kind === 'custom' ? html` · <code>${current.color}</code>` : ''}</span>
    </label>
  </div>`;
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run demo/lib/accent.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into the top bar**

In `demo/main.ts`:

1. Import: `import { accentChooser, applyAccent, readAccent, type AccentChoice } from './lib/accent.js';`
2. Right after the imports (module top level, before the first `update()`), apply the stored choice so the first paint already has it:

```ts
applyAccent(readAccent());
```

3. In `shell()`, inside `<div slot="actions" class="header-actions">`, **before** the `<kt-segmented-control … label="Theme">`:

```ts
        <kt-dropdown align="end" class="accent-menu">
          <button slot="trigger" type="button" class="accent-trigger" aria-label="Accent colour">
            <span class="accent-dot"></span>
          </button>
          <div slot="panel">
            ${accentChooser(readAccent(), (choice: AccentChoice) => {
              applyAccent(choice);
              update();
            })}
          </div>
        </kt-dropdown>
```

4. In `demo/shell.css`, after `.header-actions`:

```css
/* The accent chooser: a dot in the top bar, swatches in its panel. */
.accent-trigger {
  display: inline-grid;
  place-items: center;
  width: var(--button-height-small);
  height: var(--button-height-small);
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--radius-button);
  cursor: pointer;
}
.accent-trigger:hover {
  background: var(--surface-hover);
}
.accent-trigger:focus-visible,
.accent-swatch:focus-visible {
  outline: var(--outline-width) solid var(--color-primary-base);
  outline-offset: 2px;
}
.accent-dot {
  width: 14px;
  height: 14px;
  background: var(--color-primary-base);
  border-radius: 50%;
  box-shadow:
    0 0 0 2px var(--surface-page),
    0 0 0 3px var(--border-field);
}
.accent-panel {
  display: grid;
  gap: 12px;
  padding: 4px;
}
.accent-swatches {
  display: grid;
  grid-template-columns: repeat(7, 24px);
  gap: 8px;
}
.accent-swatch {
  width: 24px;
  height: 24px;
  padding: 0;
  background: var(--swatch);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}
.accent-swatch[aria-checked='true'] {
  box-shadow:
    0 0 0 2px var(--surface-popover),
    0 0 0 4px var(--text-body);
}
.accent-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font: var(--font-normal-small);
  cursor: pointer;
}
.accent-custom input {
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}
```

The dot reads `--color-primary-base`, so it shows the accent as the page
actually renders it. `accentSwatch` feeds the colour input's starting value.

- [ ] **Step 6: Look at it**

Dev server on 5199 with `--force`. Playwright script (keep it in the
scratchpad, copy it in to run, move it out before verify): open the panel,
screenshot dark and light; pick Green, Orange, Slate, a custom `#e11d48`;
screenshot the components page each time, in Chromium and Firefox. Check: the
dot, swatch ring, keyboard focus ring, the panel aligned under the button, no
flash of violet on reload with Green stored.

- [ ] **Step 7: Verify and commit**

```bash
npm run verify
git add demo
git commit -m "feat(demo): choose the accent colour from the top bar"
```

---

### Task 5: Documentation and release notes

**Files:**

- Modify: `src/tokens/README.md` (new section "Accent colour")
- Modify: `demo/pages/guide.ts` (new export `ACCENT`), `demo/main.ts` (route in `GUIDE`, group `Design`, slug `accent`, label `Accent colour`, after `tokens`)
- Modify: `CHANGELOG.md` (`## [1.6.0]`, `### Added`, not bold)

- [ ] **Step 1: README section** — add to `src/tokens/README.md`:

````markdown
## Accent colour

Kanto ships violet. Seven presets are a data attribute away, on the page or on
any container:

```html
<html data-accent="blue"></html>
```

`violet` · `blue` · `teal` · `green` · `orange` · `pink` · `slate`

Any other colour goes through `setAccent`, which solves the variants for it:

```js
import { setAccent } from 'kanto-ds';

setAccent('#e11d48'); // the page
setAccent('#e11d48', panel); // one container
setAccent(null); // back to the preset or the default
```

Whatever the colour, white text reads on a primary fill at 4.5:1 or more, and
the accent as text reads at 4.5:1 or more on the surfaces and on its own tint,
in both themes. A bright colour — a yellow, a light orange — is darkened for
it, as Kanto's own violet is. The neutral surfaces take a trace of the accent's
hue; a grey accent gives plain greys.

`accentPalette(color)` returns the values without applying them — to write
them into a stylesheet at build time, for instance. The inputs it sets are
`--accent-base`, `--accent-hover`, `--accent-text-dark`, `--accent-text-light`,
`--accent-wash`, `--neutral-hue` and `--neutral-chroma`; components never read
them, only the tokens do.

A red or a green accent sits close to the danger and success colours; Kanto
does not stop you, but a primary button and a destructive one will look
alike.
````

- [ ] **Step 2: Guide page** — in `demo/pages/guide.ts` export `ACCENT`, a
      markdown string with the same content as Step 1 opened by one line pointing at
      the top bar ("Try it from the dot left of the theme switch."). Add the route in
      `demo/main.ts` `GUIDE`:

```ts
  {
    section: 'guide',
    slug: 'accent',
    label: 'Accent colour',
    group: 'Design',
    page: () => markdownPage(ACCENT, 'demo/pages/guide.ts'),
  },
```

and import `ACCENT` beside `INTRODUCTION, INSTALLATION`.

- [ ] **Step 3: CHANGELOG** — under `## [1.6.0]` → `### Added`, after the
      component entries:

```markdown
**Accent colour.** The primary colour is now a choice: seven presets set with
`data-accent="blue"` on the page or a container, or any colour through
`setAccent('#e11d48')`. Contrast is solved for each colour in OKLCH — white on
a primary fill and the accent as text both hold 4.5:1 in both themes — and the
neutral surfaces take a trace of its hue. `accentPalette()` returns the values
without applying them. The docs site has a chooser in its top bar.
```

Note: the CHANGELOG "New" sidebar badge keys on bold ``**`kt-…`**`` entries;
this entry is bold text without a tag name, so check `demo/lib/releases.ts`
does not mistake it for a component (run `npx vitest run demo/lib/releases.test.ts`).
If it does, drop the bold.

- [ ] **Step 4: Verify and commit**

```bash
npm run verify
git add src/tokens/README.md demo CHANGELOG.md
git commit -m "docs: document the accent colour"
```

---

## Self-review

- **Spec coverage:** layering & inputs (T2), neutral ramp & `--neutral-chroma` (T1 maths, T2 CSS), presets & generator & match test (T3), `accentPalette`/`setAccent`/`KT_ACCENTS` & parsing (T1), subtree & theme switch (T2), docs chooser & persistence & no flash (T4), README/Guide/CHANGELOG (T5), axe under accents (T3), default-unchanged snapshot (T2). `--accent-wash` is an addition the spec implied (`--color-secondary-hover` must follow the accent and keep its default).
- **Types:** `KtAccentPalette` has `wash` in T1 and is consumed by `accentProperties` in T1/T3; `AccentChoice` defined and used only in T4.
- **Known limit, documented in code:** a `[data-accent]` element inside a light subtree re-reads light tokens; a dark subtree inside a light page is not a Kanto feature today and is not added.
