# Appearance settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Font, radius, density and text size become library settings
(`data-*` presets and `setAppearance()`), gathered with theme and accent in
one "Customise" menu on the docs site.

**Architecture:** Same layering as the accent. Token files read **inputs**
with fallbacks (`--radius-scale`, `--density-scale`, `--text-scale`,
`--font-body`, `--font-display`), never declare them, and re-declare
themselves on any element carrying a preset attribute. `appearance.css` maps
attributes to inputs. `src/theme/appearance.ts` sets and reads the
attributes. The docs site's menu stores one appearance object.

**Tech Stack:** CSS custom properties, `calc()`, `round()`; TypeScript; Lit
(docs site); Vitest (unit = happy-dom, browser = Playwright Chromium, with
`page.viewport()` for mobile width).

**Spec:** `docs/superpowers/specs/2026-10-01-appearance-design.md` (builds on `2026-10-01-accent-colour-design.md`)

## Global Constraints

- Commits in Arnaud Michel's name only, **no Co-Authored-By / Claude trailer**.
- Work on branch `feat/accent-colour` (continuation). No push, no release.
- TDD: failing test first, watched failing; then implementation; then passing.
- `npm run verify` before every commit. Scratch `zz-*` files live in the
  scratchpad and are moved out of the repo before verify.
- Defaults render exactly as today, at desktop and mobile widths.
- Never name a class member after an `HTMLElement` member.
- Lit idiom of the repo. Comments explain why, in the repo's voice.

## Ruling carried from planning

- **Font families are inputs, not tokens set by presets.** The spec's §2 had
  presets setting `--font-family-body/-display` directly. Token files
  re-declare on `[data-density]` and the other attribute elements. A
  re-declared literal family would therefore reset a `data-font` chosen on a
  parent inside any nested `data-density` container. So:
  - `--font-family-body: var(--font-body, 'Mulish', …)` and the same for
    display;
  - presets set `--font-body`/`--font-display`.
- **Cost if wrong:** two extra input names.

## Review Focus

1. **Nested containers.** `<div data-font="inter"><div data-density="compact">`
   must keep Inter inside: an inner attribute must not reset an outer
   setting. Task 1 pins it.
2. **Mobile width.** Every default value is unchanged below 600px, and
   `compact` still scales the mobile values. Task 1 pins it.
3. **`setAppearance` with an invalid key.** It must throw before changing
   anything: no half-applied appearance. Task 2 pins it.
4. **Corrupt or blocked docs storage.** The site falls back to the defaults
   without throwing, and the old keys migrate once. Task 4 pins it.
5. **Fields side by side under every density and text size.** A kt-input, a
   kt-select and a kt-date-input must stay the same height, and the radio dot
   must stay centred. Task 3 pins it.

---

## File structure

| File                                                                                   | Responsibility                                                                  |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `scripts/scale-tokens.py` (create, one-off; deleted after Task 1)                      | Mechanical rewrite of the token files and literal radii                         |
| `src/tokens/spacing.css`, `typography.css`, `responsive.css` (modify)                  | Tokens read the scale and font inputs; selectors extended                       |
| 13 component files + `src/internal/segmented-field.ts` (modify)                        | Literal radii scale                                                             |
| `src/tokens/appearance.browser.test.ts` (create)                                       | Defaults unchanged; inputs scale; nesting; presets; field heights               |
| `src/tokens/appearance.css` (create)                                                   | Attribute presets → inputs                                                      |
| `src/tokens/index.css` (modify)                                                        | Imports `appearance.css` last among colour/type/spacing                         |
| `src/theme/appearance.ts` (create)                                                     | `setAppearance`, `readAppearance`, `KT_THEMES/FONTS/RADII/DENSITIES/TEXT_SIZES` |
| `src/theme/appearance.test.ts` (create)                                                | API unit tests; preset blocks exist for every id                                |
| `src/index.ts` (modify)                                                                | Exports                                                                         |
| `src/components/a11y.browser.test.ts` (modify)                                         | axe under two appearance combos                                                 |
| `demo/lib/appearance.ts` (create; replaces `demo/lib/accent.ts`)                       | Docs storage, migration, menu rendering                                         |
| `demo/lib/appearance.test.ts` (create; replaces `demo/lib/accent.test.ts`)             | Menu unit tests                                                                 |
| `demo/main.ts`, `demo/shell.css`, `demo/index.html` (modify)                           | One Customise button; panel styles; Google Fonts for the docs only              |
| `src/tokens/README.md`, `demo/pages/guide.ts`, `demo/main.ts`, `CHANGELOG.md` (modify) | Docs                                                                            |

---

### Task 1: The tokens read scale and font inputs

**Files:**

- Create (temporary): `scripts/scale-tokens.py`
- Modify: `src/tokens/spacing.css`, `src/tokens/typography.css`, `src/tokens/responsive.css`, literal radii in components
- Test: `src/tokens/appearance.browser.test.ts`

**Interfaces:**

- Produces the CSS inputs `--radius-scale`, `--density-scale`, `--text-scale`,
  `--font-body` and `--font-display`. Token rules match `:root`,
  `[data-radius]`, `[data-density]`, `[data-text-size]` and `[data-font]`.

- [ ] **Step 1: Write the failing browser test**

`src/tokens/appearance.browser.test.ts`:

```ts
/**
 * The appearance scales in a real browser: calc() and round() over custom
 * properties resolve only there. Each token is read back by applying it to
 * a probe, since getComputedStyle returns a custom property as written.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../styles.css';

type Probe = { property: string; read: keyof CSSStyleDeclaration };
const AS: Record<string, Probe> = {
  radius: { property: 'border-top-left-radius', read: 'borderTopLeftRadius' },
  length: { property: 'width', read: 'width' },
  padding: { property: 'padding', read: 'padding' },
  font: { property: 'font', read: 'font' },
};

/** What `token` resolves to on `element`, through the CSS property `kind` uses. */
function resolve(token: string, kind: keyof typeof AS, element: Element = document.body): string {
  const probe = document.createElement('div');
  probe.style.setProperty(AS[kind]!.property, `var(${token})`);
  probe.style.boxSizing = 'content-box';
  element.append(probe);
  const value = String(getComputedStyle(probe)[AS[kind]!.read]);
  probe.remove();
  return value;
}
const fontSize = (token: string, element?: Element) => {
  const probe = document.createElement('div');
  probe.style.font = `var(${token})`;
  (element ?? document.body).append(probe);
  const { fontSize: size, lineHeight, fontFamily } = getComputedStyle(probe);
  probe.remove();
  return { size, lineHeight, fontFamily };
};

afterEach(async () => {
  for (const name of ['radius', 'density', 'textSize', 'font']) {
    delete document.documentElement.dataset[name];
  }
  document.documentElement.removeAttribute('style');
  document.body.replaceChildren();
  await page.viewport(1280, 800);
});

describe('the default appearance', () => {
  it('keeps every desktop value', async () => {
    await page.viewport(1280, 800);
    expect(resolve('--border-radius', 'radius')).toBe('8px');
    expect(resolve('--border-radius-card', 'radius')).toBe('12px');
    expect(resolve('--radius-input', 'radius')).toBe('8px');
    expect(resolve('--radius-modal', 'radius')).toBe('12px');
    expect(resolve('--radius-sub-menu', 'radius')).toBe('2px');
    expect(resolve('--button-height-small', 'length')).toBe('32px');
    expect(resolve('--button-height', 'length')).toBe('40px');
    expect(resolve('--button-height-large', 'length')).toBe('48px');
    expect(resolve('--button-padding-x', 'length')).toBe('16px');
    expect(resolve('--padding-card', 'padding')).toBe('24px');
    expect(resolve('--padding-expand-item', 'padding')).toBe('8px 16px');
    expect(resolve('--gap-card', 'length')).toBe('20px');
    expect(fontSize('--font-normal-regular').size).toBe('14px');
    expect(fontSize('--font-title-h1')).toMatchObject({ size: '36px', lineHeight: '43px' });
    expect(fontSize('--font-normal-regular').fontFamily).toMatch(/^Mulish/);
    expect(fontSize('--font-title-h1').fontFamily).toMatch(/^Manrope/);
  });

  it('keeps every mobile value', async () => {
    await page.viewport(400, 800);
    expect(resolve('--button-height', 'length')).toBe('36px');
    expect(resolve('--padding-card', 'padding')).toBe('16px');
    expect(fontSize('--font-normal-regular')).toMatchObject({ size: '12px', lineHeight: '18px' });
  });
});

describe('the scale inputs', () => {
  it('scale radius, density and text, on whole pixels where it matters', () => {
    const root = document.documentElement;
    root.style.setProperty('--radius-scale', '1.75');
    root.style.setProperty('--density-scale', '0.85');
    root.style.setProperty('--text-scale', '1.125');
    expect(resolve('--radius-input', 'radius')).toBe('14px');
    expect(resolve('--button-height', 'length')).toBe('34px');
    expect(resolve('--button-height-small', 'length')).toBe('28px');
    expect(resolve('--padding-card', 'padding')).toBe('20px');
    expect(fontSize('--font-normal-regular').size).toBe('15.75px');
  });

  it('compose with the mobile scale', async () => {
    await page.viewport(400, 800);
    document.documentElement.style.setProperty('--density-scale', '0.85');
    expect(resolve('--button-height', 'length')).toBe('30px'); // 36 × 0.85 = 30.6 → 30
  });

  it('take a font input for body and display', () => {
    document.documentElement.style.setProperty('--font-body', "'Inter', sans-serif");
    expect(fontSize('--font-normal-regular').fontFamily).toMatch(/^Inter/);
    expect(fontSize('--font-title-h1').fontFamily).toMatch(/^Manrope/);
  });

  it('let a nested setting keep the outer one', () => {
    const outer = document.createElement('div');
    outer.dataset['font'] = 'x';
    outer.style.setProperty('--font-body', "'Inter', sans-serif");
    const inner = document.createElement('div');
    inner.dataset['density'] = 'x';
    inner.style.setProperty('--density-scale', '0.85');
    outer.append(inner);
    document.body.append(outer);
    expect(fontSize('--font-normal-regular', inner).fontFamily).toMatch(/^Inter/);
    expect(resolve('--button-height', 'length', inner)).toBe('34px');
    expect(resolve('--button-height', 'length', outer)).toBe('40px');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --project browser src/tokens/appearance.browser.test.ts`
Expected:

- "the default appearance": both tests PASS.
- "the scale inputs": all FAIL, with values unchanged, e.g. `expected '8px' to be '14px'`.

- [ ] **Step 3: Write and run the rewrite script**

`scripts/scale-tokens.py`:

```python
"""One-off: rewrite Kanto's spacing, type and radius tokens as functions of
the appearance inputs. Deleted once its output is committed."""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SELECTOR = ':root,\n[data-radius],\n[data-density],\n[data-text-size],\n[data-font] {'

RADIUS = r'--(?:border-radius|border-radius-card|radius-input|radius-modal|radius-sub-menu)'
HEIGHT = r'--button-height(?:-small|-large)?'
SPACE = r'--(?:button-padding-x|padding-[a-z-]+|gap-[a-z-]+|text-area-padding)'

def radius(m):
    return f'{m[1]}: calc({m[2]}px * var(--radius-scale, 1));'

def height(m):
    return f'{m[1]}: round(nearest, calc({m[2]}px * var(--density-scale, 1)), 2px);'

def space(m):
    values = re.sub(
        r'\b(\d+)px',
        lambda v: v[0] if v[1] == '0' else f'round(nearest, calc({v[1]}px * var(--density-scale, 1)), 1px)',
        m[2],
    )
    return f'{m[1]}: {values};'

FONT = re.compile(r'(--font-[a-z0-9-]+): (\d{3}) (\d+)px(?:/(\d+)px|(/[\d.]+))? (var\(--font-family-[a-z]+\));')

def rewrite(path, families=False):
    text = path.read_text()
    text = re.sub(r'^(\s*):root \{', lambda m: m[1] + SELECTOR.replace('\n', '\n' + m[1]), text, flags=re.M)
    text = re.sub(rf'({RADIUS}): (\d+)px;', radius, text)
    text = re.sub(rf'({HEIGHT}): (\d+)px;', height, text)
    text = re.sub(rf'({SPACE}): ([^;]+);', space, text)
    # A line-height given as px scales with the size; a unitless one already does.
    text = FONT.sub(_font, text)
    if families:
        text = text.replace("--font-family-display: 'Manrope'", "--font-family-display: var(--font-display, 'Manrope'")
        text = text.replace("--font-family-body: 'Mulish'", "--font-family-body: var(--font-body, 'Mulish'")
        text = re.sub(r"(--font-family-(?:display|body): var\(--font-[a-z]+, [^;]+);", r'\1);', text)
    path.write_text(text)

def _font(m):
    size = f'calc({m[3]}px * var(--text-scale, 1))'
    if m[4]:
        line = f' / calc({m[4]}px * var(--text-scale, 1))'
    elif m[5]:
        line = m[5]
    else:
        line = ''
    return f'{m[1]}: {m[2]} {size}{line} {m[6]};'

rewrite(ROOT / 'src/tokens/spacing.css')
rewrite(ROOT / 'src/tokens/typography.css', families=True)
rewrite(ROOT / 'src/tokens/responsive.css')

# Literal small radii inside components scale with the rest.
for path in [*ROOT.glob('src/components/**/*.ts'), ROOT / 'src/internal/segmented-field.ts']:
    if path.name.endswith('.test.ts'):
        continue
    text = path.read_text()
    new = re.sub(r'border-radius: ([1-9]\d?)px;', r'border-radius: calc(\1px * var(--radius-scale, 1));', text)
    if new != text:
        path.write_text(new)
        print('radius:', path.relative_to(ROOT))
```

Run:

```bash
python3 scripts/scale-tokens.py
npx prettier --write src/tokens/*.css 'src/components/**/*.ts' src/internal/segmented-field.ts
git diff --stat
```

Expected:

- 3 token files changed.
- The radius list prints 13 files: breadcrumb, tabs, chart, code, kbd,
  collapsible, multi-select, drag-drop, input, alert, skeleton, toast and
  segmented-field.

Read the diff of `typography.css` and `responsive.css`, and check that:

- every `--font-*` shorthand has `calc(Npx * var(--text-scale, 1))`;
- `--font-input: 400 16px/1.4 …` keeps `/1.4`;
- `--letter-spacing-overline` is untouched;
- the reduced-motion block got the selector list too, which is harmless.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run --project browser src/tokens/appearance.browser.test.ts src/tokens/tokens.browser.test.ts`
Expected: PASS.

If `'15.75px'` comes back as another rounding, read what Chromium prints and
make it the expectation. Ledger it as a ruling.

- [ ] **Step 5: Delete the script, verify, commit**

```bash
rm scripts/scale-tokens.py
npm run verify
git add -A src
git commit -m "feat(tokens): scale radius, density and text from appearance inputs"
```

If size budgets fail (the literal radii grow every component by a few
bytes), raise only the failing entries (back up `size-budget.json`, run
`node scripts/check-size.js --update`, copy those values back) and say which
in the commit body.

---

### Task 2: Presets and the `setAppearance` API

**Files:**

- Create: `src/tokens/appearance.css`, `src/theme/appearance.ts`, `src/theme/appearance.test.ts`
- Modify: `src/tokens/index.css`, `src/index.ts`, `src/tokens/appearance.browser.test.ts`

**Interfaces:**

- Consumes: `KT_ACCENTS`, `setAccent` and `parseColor` from `src/theme/accent.ts`.
- Produces:
  - `type KtTheme = 'dark' | 'light' | 'auto'`
  - `type KtFont = 'kanto' | 'system' | 'inter' | 'plex' | 'geist'`
  - `type KtRadius = 'sharp' | 'default' | 'round'`
  - `type KtDensity = 'compact' | 'default' | 'comfortable'`
  - `type KtTextSize = 'small' | 'default' | 'large'`
  - `interface KtAppearance { theme?; accent?: string; font?; radius?; density?; textSize? }`
  - `KT_THEMES`, `KT_FONTS` (with `family`), `KT_RADII`, `KT_DENSITIES` and `KT_TEXT_SIZES`, each `readonly { id; label }[]`
  - `KT_DEFAULT_APPEARANCE: Required<KtAppearance>`
  - `setAppearance(appearance: KtAppearance, root?: HTMLElement): void`
  - `readAppearance(root?: HTMLElement): Required<KtAppearance>`

- [ ] **Step 1: Write the failing tests**

`src/theme/appearance.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  KT_DENSITIES,
  KT_FONTS,
  KT_RADII,
  KT_TEXT_SIZES,
  readAppearance,
  setAppearance,
} from './appearance.js';

const css = readFileSync(join(process.cwd(), 'src/tokens/appearance.css'), 'utf8');

afterEach(() => {
  const root = document.documentElement;
  for (const name of ['theme', 'accent', 'font', 'radius', 'density', 'textSize']) {
    delete root.dataset[name];
  }
  root.removeAttribute('style');
});

describe('setAppearance', () => {
  it('sets each setting as an attribute, and a default as none', () => {
    const root = document.createElement('div');
    setAppearance(
      { theme: 'light', font: 'inter', radius: 'round', density: 'compact', textSize: 'large' },
      root,
    );
    expect({ ...root.dataset }).toEqual({
      theme: 'light',
      font: 'inter',
      radius: 'round',
      density: 'compact',
      textSize: 'large',
    });

    setAppearance({ radius: 'default', font: 'kanto', theme: 'dark' }, root);
    expect({ ...root.dataset }).toEqual({ density: 'compact', textSize: 'large' });
  });

  it('touches only the settings it is given', () => {
    const root = document.createElement('div');
    setAppearance({ density: 'compact' }, root);
    setAppearance({ radius: 'sharp' }, root);
    expect(root.dataset['density']).toBe('compact');
  });

  it('takes a preset accent by id and any other colour through setAccent', () => {
    const root = document.createElement('div');
    setAppearance({ accent: 'green' }, root);
    expect(root.dataset['accent']).toBe('green');
    setAppearance({ accent: '#e11d48' }, root);
    expect(root.dataset['accent']).toBe('custom');
    expect(root.style.getPropertyValue('--accent-base')).not.toBe('');
    setAppearance({ accent: 'violet' }, root);
    expect(root.hasAttribute('data-accent')).toBe(false);
    expect(root.style.getPropertyValue('--accent-base')).toBe('');
  });

  it('throws on an unknown value before changing anything', () => {
    const root = document.createElement('div');
    setAppearance({ density: 'compact' }, root);
    expect(() => setAppearance({ density: 'comfortable', radius: 'xl' as never }, root)).toThrow(
      /radius.*sharp, default, round/,
    );
    expect(() => setAppearance({ density: 'comfortable', accent: 'not a colour' }, root)).toThrow(
      TypeError,
    );
    expect(root.dataset['density']).toBe('compact');
  });

  it('defaults to the document element', () => {
    setAppearance({ textSize: 'small' });
    expect(document.documentElement.dataset['textSize']).toBe('small');
  });
});

describe('readAppearance', () => {
  it('reads defaults from a bare element', () => {
    expect(readAppearance(document.createElement('div'))).toEqual({
      theme: 'dark',
      accent: 'violet',
      font: 'kanto',
      radius: 'default',
      density: 'default',
      textSize: 'default',
    });
  });

  it('reads back what setAppearance set, a custom accent as its fill', () => {
    const root = document.createElement('div');
    setAppearance({ theme: 'auto', accent: '#e11d48', font: 'plex', density: 'comfortable' }, root);
    const read = readAppearance(root);
    expect(read).toMatchObject({ theme: 'auto', font: 'plex', density: 'comfortable' });
    expect(read.accent).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('ignores an attribute it does not know', () => {
    const root = document.createElement('div');
    root.dataset['radius'] = 'blob';
    expect(readAppearance(root).radius).toBe('default');
  });
});

describe('appearance.css', () => {
  it('has a block for every non-default preset', () => {
    for (const [attribute, list] of [
      ['data-font', KT_FONTS],
      ['data-radius', KT_RADII],
      ['data-density', KT_DENSITIES],
      ['data-text-size', KT_TEXT_SIZES],
    ] as const) {
      for (const { id } of list) {
        if (id === 'default' || id === 'kanto') continue;
        expect(css).toContain(`[${attribute}='${id}']`);
      }
    }
  });
});
```

Add to `src/tokens/appearance.browser.test.ts` a `describe('the presets', …)`:

```ts
describe('the presets', () => {
  it('scale through their attributes', () => {
    const root = document.documentElement;
    root.dataset['radius'] = 'round';
    root.dataset['density'] = 'compact';
    root.dataset['textSize'] = 'large';
    root.dataset['font'] = 'system';
    expect(resolve('--radius-input', 'radius')).toBe('14px');
    expect(resolve('--button-height', 'length')).toBe('34px');
    expect(fontSize('--font-normal-regular').size).toBe('15.75px');
    expect(fontSize('--font-normal-regular').fontFamily).toMatch(/^system-ui/);
    expect(fontSize('--font-title-h1').fontFamily).toMatch(/^system-ui/);
  });

  it('sharpen and loosen', () => {
    const root = document.documentElement;
    root.dataset['radius'] = 'sharp';
    root.dataset['density'] = 'comfortable';
    expect(resolve('--radius-input', 'radius')).toBe('2px');
    expect(resolve('--button-height', 'length')).toBe('46px');
  });

  it('apply on a container inside a light subtree', () => {
    const light = document.createElement('div');
    light.dataset['theme'] = 'light';
    const box = document.createElement('div');
    box.dataset['density'] = 'compact';
    light.append(box);
    document.body.append(light);
    expect(resolve('--button-height', 'length', box)).toBe('34px');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/theme/appearance.test.ts`
Expected: FAIL. Vite cannot resolve `./appearance.js`, or `readFileSync`
throws ENOENT on `appearance.css`.

Run: `npx vitest run --project browser src/tokens/appearance.browser.test.ts -t presets`
Expected: FAIL (`expected '8px' to be '14px'`).

- [ ] **Step 3: Write `src/tokens/appearance.css`**

```css
/**
 * Appearance presets: the font, corners, density and text size, each a data
 * attribute on the page or any container.
 *
 *     <html data-font="inter" data-radius="round" data-density="compact">
 *
 * Each sets an input the token layer reads; the tokens re-declare themselves
 * on any element carrying one of these attributes, so a container can differ
 * from the page. Kanto ships its own fonts only: an app choosing Inter, IBM
 * Plex Sans or Geist loads the face itself, or the system stack shows.
 */

[data-radius='sharp'] {
  --radius-scale: 0.25;
}
[data-radius='round'] {
  --radius-scale: 1.75;
}

[data-density='compact'] {
  --density-scale: 0.85;
}
[data-density='comfortable'] {
  --density-scale: 1.15;
}

[data-text-size='small'] {
  --text-scale: 0.93;
}
[data-text-size='large'] {
  --text-scale: 1.125;
}

[data-font='system'] {
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-display: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
[data-font='inter'] {
  --font-body: 'Inter', system-ui, sans-serif;
  --font-display: 'Inter', system-ui, sans-serif;
}
[data-font='plex'] {
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-display: 'IBM Plex Sans', system-ui, sans-serif;
}
[data-font='geist'] {
  --font-body: 'Geist', system-ui, sans-serif;
  --font-display: 'Geist', system-ui, sans-serif;
}

/* The defaults, spelled out so a container can go back to them inside one
   that changed them — each resetting its own scale only. */
[data-radius='default'] {
  --radius-scale: 1;
}
[data-density='default'] {
  --density-scale: 1;
}
[data-text-size='default'] {
  --text-scale: 1;
}
[data-font='kanto'] {
  --font-body: 'Mulish', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-display: 'Manrope', 'Segoe UI', system-ui, sans-serif;
}
```

In `src/tokens/index.css`, add `@import './appearance.css';` after
`@import './responsive.css';`.

- [ ] **Step 4: Write `src/theme/appearance.ts`**

```ts
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
```

Export from `src/index.ts`, after the accent block:

```ts
export {
  KT_DEFAULT_APPEARANCE,
  KT_DENSITIES,
  KT_FONTS,
  KT_RADII,
  KT_TEXT_SIZES,
  KT_THEMES,
  readAppearance,
  setAppearance,
} from './theme/appearance.js';
export type {
  KtAppearance,
  KtDensity,
  KtFont,
  KtRadius,
  KtTextSize,
  KtTheme,
} from './theme/appearance.js';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/theme/appearance.test.ts && npx vitest run --project browser src/tokens/appearance.browser.test.ts`
Expected: PASS.

- [ ] **Step 6: Verify and commit**

```bash
npm run verify
git add src
git commit -m "feat(theme): set font, radius, density and text size with setAppearance"
```

---

### Task 3: Guards — fields and axe under every appearance

**Files:**

- Modify: `src/tokens/appearance.browser.test.ts`, `src/components/a11y.browser.test.ts`

**Interfaces:** consumes the attributes from Task 2.

- [ ] **Step 1: Write the guard tests**

Append to `src/tokens/appearance.browser.test.ts` (and import
`'../index.js'` and `fixture`/`settle` from `'#test/fixture'` at the top):

```ts
describe.each([
  ['compact', 'small'],
  ['default', 'default'],
  ['comfortable', 'large'],
])('fields at density %s, text %s', (density, textSize) => {
  it('stand as tall as one another and the button height', async () => {
    document.documentElement.dataset['density'] = density;
    document.documentElement.dataset['textSize'] = textSize;
    const row = await fixture<HTMLDivElement>(`<div>
      <kt-input label="Name"></kt-input>
      <kt-select label="Country"></kt-select>
      <kt-date-input label="Due" locale="en-GB"></kt-date-input>
      <kt-time-input label="At" locale="en-GB"></kt-time-input>
      <kt-date-picker label="Due"></kt-date-picker>
    </div>`);
    const heights = [...row.children].map((el) =>
      Math.round(
        el.shadowRoot!.querySelector('.field, [part="field"], button')!.getBoundingClientRect()
          .height,
      ),
    );
    const expected = Math.round(parseFloat(resolve('--button-height', 'length')));
    expect(heights).toEqual(heights.map(() => expected));
  });

  it('keep the radio dot centred', async () => {
    document.documentElement.dataset['density'] = density;
    document.documentElement.dataset['textSize'] = textSize;
    const group = await fixture<HTMLElement>(
      '<kt-radio-group label="Plan" value="a"><kt-radio value="a">A</kt-radio></kt-radio-group>',
    );
    const radio = group.querySelector('kt-radio')!;
    await settle(radio);
    const ring = radio.shadowRoot!.querySelector('.dot')!.parentElement!.getBoundingClientRect();
    const dot = radio.shadowRoot!.querySelector('.dot')!.getBoundingClientRect();
    expect(Math.abs(dot.x + dot.width / 2 - (ring.x + ring.width / 2))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(dot.y + dot.height / 2 - (ring.y + ring.height / 2))).toBeLessThanOrEqual(0.5);
  });
});
```

The field selector is a best guess. Before running, open each component's
`render()` and use the element that carries the field's height. The radio's
ring is whatever `kt-radio`'s existing centring test measures against: copy
that test's selectors (`grep -n "dot" src/components/forms/kt-radio-group/*.browser.test.ts`).

In `src/components/a11y.browser.test.ts`, append:

```ts
describe.each([
  { density: 'compact', textSize: 'small', radius: 'sharp' },
  { density: 'comfortable', textSize: 'large', radius: 'round' },
])('accessibility, appearance %o', (appearance) => {
  afterEach(() => {
    for (const key of Object.keys(appearance)) delete document.documentElement.dataset[key];
  });
  it.each(Object.entries(CASES))('%s has no axe violations', async (_, { markup, setup }) => {
    Object.assign(document.documentElement.dataset, appearance);
    const element = await fixture<HTMLElement>(markup);
    setup?.(element);
    expect((await audit(element)).join('\n')).toBe('');
  });
});
```

- [ ] **Step 2: Run them**

Run: `npx vitest run --project browser src/tokens/appearance.browser.test.ts src/components/a11y.browser.test.ts`

These guard Task 1's rewrite, so they may pass at once. To show they can
fail, temporarily change `round(nearest, …, 2px)` to `1px` in
`--button-height` (spacing.css). Run them: at `compact` the field heights
should split on half pixels. Restore the file afterwards.

If a guard fails for real, the cause is a component sizing itself in
literal px against a scaled token. Fix the component with
superpowers:systematic-debugging, add the failing case as its own test, and
ledger it.

- [ ] **Step 3: Verify and commit**

```bash
npm run verify
git add src
git commit -m "test(tokens): hold fields and contrast under every appearance"
```

---

### Task 4: The docs site's Customise menu

**Files:**

- Create: `demo/lib/appearance.ts`, `demo/lib/appearance.test.ts`
- Delete: `demo/lib/accent.ts`, `demo/lib/accent.test.ts` (their tests move into the new file, adapted)
- Modify: `demo/main.ts`, `demo/shell.css`, `demo/index.html`

**Interfaces:**

- Consumes: `setAppearance`, `readAppearance`, `KT_*` and `KT_DEFAULT_APPEARANCE` from `kanto-ds`.
- Produces:
  - `type DocsAppearance = Required<KtAppearance>`
  - `readDocsAppearance(): DocsAppearance`, which never throws, migrates the
    old keys and validates each field
  - `applyDocsAppearance(appearance: DocsAppearance): void`, which applies and
    stores
  - `customiseMenu(current: DocsAppearance, onChange: (next: DocsAppearance) => void): TemplateResult`

- [ ] **Step 1: Write the failing tests**

`demo/lib/appearance.test.ts`:

```ts
import { render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { applyDocsAppearance, customiseMenu, readDocsAppearance } from './appearance.js';

const KEY = 'kanto-docs-appearance';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  const root = document.documentElement;
  for (const name of ['theme', 'accent', 'font', 'radius', 'density', 'textSize']) {
    delete root.dataset[name];
  }
  root.removeAttribute('style');
  document.body.replaceChildren();
});

describe('the stored appearance', () => {
  it('is the default when nothing is stored', () => {
    expect(readDocsAppearance()).toEqual(KT_DEFAULT_APPEARANCE);
  });

  it('keeps what is valid and drops what is not', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ theme: 'light', font: 'comic', density: 'compact', accent: 'oklch(.)' }),
    );
    expect(readDocsAppearance()).toEqual({
      ...KT_DEFAULT_APPEARANCE,
      theme: 'light',
      density: 'compact',
    });
    localStorage.setItem(KEY, '{nope');
    expect(readDocsAppearance()).toEqual(KT_DEFAULT_APPEARANCE);
  });

  it('migrates the theme and accent kept under the old keys', () => {
    localStorage.setItem('kanto-docs-theme', 'light');
    localStorage.setItem('kanto-docs-accent', JSON.stringify({ kind: 'custom', color: '#16a34a' }));
    expect(readDocsAppearance()).toMatchObject({ theme: 'light', accent: '#16a34a' });
    localStorage.setItem('kanto-docs-accent', JSON.stringify({ kind: 'preset', id: 'teal' }));
    expect(readDocsAppearance().accent).toBe('teal');
  });

  it('is the default when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readDocsAppearance()).toEqual(KT_DEFAULT_APPEARANCE);
  });

  it('applies to the page and is kept, even when storage is blocked', () => {
    applyDocsAppearance({ ...KT_DEFAULT_APPEARANCE, density: 'compact', accent: 'green' });
    expect(document.documentElement.dataset['density']).toBe('compact');
    expect(document.documentElement.dataset['accent']).toBe('green');
    expect(readDocsAppearance().density).toBe('compact');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => applyDocsAppearance({ ...KT_DEFAULT_APPEARANCE, radius: 'round' })).not.toThrow();
    expect(document.documentElement.dataset['radius']).toBe('round');
  });
});

describe('the Customise menu', () => {
  function mount(current = KT_DEFAULT_APPEARANCE) {
    const onChange = vi.fn();
    const host = document.body.appendChild(document.createElement('div'));
    render(customiseMenu(current, onChange), host);
    return { host, onChange };
  }

  it('opens from a sliders icon button named Customise', () => {
    const trigger = mount().host.querySelector('kt-dropdown > kt-button[slot="trigger"]')!;
    expect(trigger.getAttribute('icon')).toBe('sliders-horizontal');
    expect(trigger.getAttribute('label')).toBe('Customise');
  });

  it('has a section for each setting', () => {
    const headings = [...mount().host.querySelectorAll('.customise-heading')].map((h) =>
      h.textContent!.trim(),
    );
    expect(headings).toEqual(['Theme', 'Accent', 'Font', 'Corners', 'Density', 'Text size']);
  });

  it('changes one setting and keeps the rest', () => {
    const { host, onChange } = mount({ ...KT_DEFAULT_APPEARANCE, density: 'compact' });
    host.querySelector<HTMLElement>('[data-accent-id="blue"]')!.click();
    expect(onChange).toHaveBeenLastCalledWith({
      ...KT_DEFAULT_APPEARANCE,
      density: 'compact',
      accent: 'blue',
    });
    host.querySelector<HTMLElement>('[data-font-id="inter"]')!.click();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ font: 'inter' }));
  });

  it('takes a segmented choice', () => {
    const { host, onChange } = mount();
    const density = host.querySelector('kt-segmented-control[label="Density"]')!;
    density.dispatchEvent(
      new CustomEvent('kt-change', { detail: { value: 'comfortable' }, bubbles: true }),
    );
    expect(onChange).toHaveBeenLastCalledWith({ ...KT_DEFAULT_APPEARANCE, density: 'comfortable' });
  });

  it('shows each font in its own face, the current one checked', () => {
    const fonts = [
      ...mount({ ...KT_DEFAULT_APPEARANCE, font: 'plex' }).host.querySelectorAll<HTMLElement>(
        '[data-font-id]',
      ),
    ];
    expect(fonts.map((f) => f.style.fontFamily)).toEqual(
      expect.arrayContaining([expect.stringContaining('IBM Plex Sans')]),
    );
    expect(fonts.find((f) => f.getAttribute('aria-checked') === 'true')!.dataset['fontId']).toBe(
      'plex',
    );
  });

  it('resets everything to Kanto', () => {
    const { host, onChange } = mount({ ...KT_DEFAULT_APPEARANCE, font: 'geist', radius: 'round' });
    host.querySelector<HTMLElement>('.customise-reset')!.click();
    expect(onChange).toHaveBeenLastCalledWith(KT_DEFAULT_APPEARANCE);
  });

  it('keeps the accent chooser: arrows, custom colour', () => {
    const { host, onChange } = mount();
    const radios = [...host.querySelectorAll<HTMLElement>('[data-accent-id]')];
    radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ accent: 'blue' }));
    const input = host.querySelector<HTMLInputElement>('input[type="color"]')!;
    input.value = '#16a34a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ accent: '#16a34a' }));
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run demo/lib/appearance.test.ts`
Expected: FAIL — cannot resolve `./appearance.js`.

- [ ] **Step 3: Write `demo/lib/appearance.ts`**

Move the accent chooser from `demo/lib/accent.ts` into it, adapted to take
`accent: string` (a preset id or a colour) instead of `AccentChoice`. Keep
all of its behaviour:

- the radiogroup;
- roving tabindex;
- arrows that pick as they move;
- the custom swatch with an invisible colour input and a pipette;
- the hex shown when a custom colour is in use.

```ts
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
```

Then:

- `accentChooser(accent: string, onPick: (accent: string) => void)`, carried
  over;
- `fontChooser(font, onPick)`: a `role="radiogroup"` of buttons
  (`role="radio"`, `data-font-id`, `style="font-family: …"` from
  `KT_FONTS[i].family`, roving tabindex and arrows like the accent);
- `segmented(label, list, value, onPick)`: a
  `<kt-segmented-control size="small" label=… .options=${list.map(({id, label}) => ({ value: id, label }))} .value=… @kt-change=…>`.

`customiseMenu` assembles them:

```ts
export function customiseMenu(
  current: DocsAppearance,
  onChange: (next: DocsAppearance) => void,
): TemplateResult {
  const set = (patch: Partial<DocsAppearance>) => onChange({ ...current, ...patch });
  const section = (heading: string, body: TemplateResult) =>
    html`<section class="customise-section">
      <p class="customise-heading">${heading}</p>
      ${body}
    </section>`;

  return html`<kt-dropdown align="end" class="customise-menu">
    <kt-button
      slot="trigger"
      size="small"
      variant="secondary-no-bg"
      icon="sliders-horizontal"
      label="Customise"
    ></kt-button>
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run demo/lib/appearance.test.ts`
Expected: PASS. Then `git rm demo/lib/accent.ts demo/lib/accent.test.ts`.

- [ ] **Step 5: Wire it into the site**

`demo/main.ts`:

- Remove `THEME_KEY`, `Theme`, `readTheme` and `applyTheme`, the theme
  `kt-segmented-control`, the `accentMenu` call and the `accent` variable.
- Import `customiseMenu`, `applyDocsAppearance`, `readDocsAppearance` and
  `type DocsAppearance` from `./lib/appearance.js`.
- Keep the current appearance in a module variable:
  `let appearance: DocsAppearance = readDocsAppearance();`
- Where `applyTheme(readTheme())` was, call `applyDocsAppearance(appearance);`
  before the first `update()`.
- In the header actions, first:

```ts
        ${customiseMenu(appearance, (next) => {
          appearance = next;
          applyDocsAppearance(next);
          update();
        })}
```

`demo/index.html`, in `<head>`. These are for the docs site only; the
library ships Kanto's own faces:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Inter:wght@400;500;600&display=swap"
/>
```

`demo/shell.css`:

- Rename the `.accent-menu` rule to `.customise-menu::part(panel)`, with
  `width: 288px; max-height: min(80vh, 640px); overflow: auto;`.
- Add:

```css
.customise-panel {
  display: grid;
  gap: 16px;
  padding: 4px;
  text-align: start;
}
.customise-section {
  display: grid;
  gap: 8px;
}
.customise-heading {
  margin: 0;
  color: var(--text-muted);
  font: var(--font-normal-small);
}
.customise-section kt-segmented-control {
  width: 100%;
}
.font-choices {
  display: grid;
  gap: 2px;
}
.font-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  color: var(--text-body);
  font-size: 14px;
  text-align: start;
  background: none;
  border: none;
  border-radius: var(--radius-input);
  cursor: pointer;
}
.font-choice:hover {
  background: var(--surface-hover);
}
.font-choice[aria-checked='true'] {
  color: var(--color-primary-text);
  background: var(--color-primary-soft);
}
.font-choice:focus-visible {
  outline: var(--outline-width) solid var(--color-primary-base);
  outline-offset: -2px;
}
.customise-reset {
  justify-self: start;
}
```

Keep the existing `.accent-*` rules: the chooser still uses them. Drop the
`.accent-heading` rule and its element, since the section heading replaces
it.

- [ ] **Step 6: Look at it**

Dev server on 5199 with `--force`. Playwright script in the scratchpad, run
in Chromium and Firefox, dark and light:

1. Open the panel and screenshot it.
2. Pick Inter + Round + Compact + Large and screenshot the button page and
   the date-picker page.
3. Reload: the appearance is kept, with no flash (`data-density` is set at
   `domcontentloaded`).
4. Reset: everything goes back.

Check that:

- the panel fits on a 400px-wide phone viewport and scrolls inside;
- the segmented controls fit the panel width;
- the font names render in their own faces.

- [ ] **Step 7: Verify and commit**

```bash
npm run verify
git add -A demo
git commit -m "feat(demo): gather theme, accent, font, corners, density and text size in a Customise menu"
```

---

### Task 5: Documentation

**Files:** `src/tokens/README.md`, `demo/pages/guide.ts`, `demo/main.ts`, `CHANGELOG.md`

- [ ] **Step 1: README** — rename the "Accent colour" section's parent context:
      add after it a section:

````markdown
## Appearance

Besides the accent, four settings change how Kanto looks. Each is a data
attribute, on the page or on any container:

```html
<html data-font="inter" data-radius="round" data-density="compact" data-text-size="large"></html>
```

| Attribute        | Values                                          |
| ---------------- | ----------------------------------------------- |
| `data-font`      | `kanto` · `system` · `inter` · `plex` · `geist` |
| `data-radius`    | `sharp` · `default` · `round`                   |
| `data-density`   | `compact` · `default` · `comfortable`           |
| `data-text-size` | `small` · `default` · `large`                   |
| `data-theme`     | `dark` · `light` · `auto`                       |

Or all at once, with the accent:

```js
import { setAppearance, readAppearance } from 'kanto-ds';

setAppearance({ theme: 'auto', accent: 'teal', font: 'inter', density: 'compact' });
readAppearance(); // { theme: 'auto', accent: 'teal', font: 'inter', radius: 'default', … }
```

`setAppearance` changes only the settings it is given, and checks them all
first: an unknown value throws and changes nothing.

Density scales control heights, paddings and gaps — a button is 34px in
`compact`, 46px in `comfortable` — on whole pixels. Text size scales every
type style. Both compose with the mobile and ultra-wide scales.

Kanto ships its own faces only. With `inter`, `plex` or `geist`, load the font
yourself (Google Fonts has all three); without it, the system face shows.

The inputs behind the attributes are `--radius-scale`, `--density-scale`,
`--text-scale`, `--font-body` and `--font-display`. Set in CSS, they need one
of the attributes on the same element for the tokens to re-read them there;
`--font-*` take a full font stack, the scales a plain number.
````

- [ ] **Step 2: Guide page** — in `demo/pages/guide.ts`, rename `ACCENT` to
      `APPEARANCE`. Its title becomes "Appearance", its first line "Try it from
      Customise, in the top bar.", then the accent content, then the Appearance
      section above. In `demo/main.ts` the route's slug becomes `appearance` and
      its label `Appearance`.

- [ ] **Step 3: CHANGELOG** — in 1.6.0's "Accent colour" entry, change the
      last sentence to "The docs site has a Customise menu in its top bar.", and
      add after it:

```markdown
**Appearance.** Font, corners, density and text size join the accent as
settings: `data-font`, `data-radius`, `data-density` and `data-text-size` on
the page or a container, or `setAppearance({ … })` for all of them with the
theme and accent. Density and text size compose with the responsive scales;
the defaults render as before.
```

- [ ] **Step 4: Verify and commit**

Screenshot `#/guide/appearance` (no page errors). Then:

```bash
npm run verify
git add src/tokens/README.md demo CHANGELOG.md
git commit -m "docs: document the appearance settings"
```

---

## Self-review

- **Spec coverage:**
  - §1 inputs: T1.
  - §2 presets and re-declaration: T1 (selectors) and T2 (`appearance.css`).
  - §3 API: T2.
  - §4 menu, storage, migration, reset and Google Fonts: T4.
  - §5 docs: T5.
  - Testing section: T1 (defaults at desktop and mobile, scales), T2
    (presets, container in a light subtree, API), T3 (fields, radio, axe),
    T4 (menu, storage).
- **One judgement left to execution:** T3's field and radio selectors are
  read from each component's render() and its existing centring test.
- **Types:**
  - `DocsAppearance = Required<KtAppearance>` is used in T4 only.
  - `KT_DEFAULT_APPEARANCE` is produced in T2 and consumed in T4.
  - The `dataset` key `textSize` maps to `data-text-size` throughout.
