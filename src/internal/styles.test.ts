import { describe, expect, it } from 'vitest';
import type { CSSResultGroup } from 'lit';

import * as kanto from 'kanto-ds';

/**
 * Every element the package exports, found rather than listed: a hand-kept
 * list covered 15 of them, and the literals these rules exist to catch sat in
 * the ones it left out.
 */
const ELEMENTS: readonly [string, { styles: CSSResultGroup }][] = Object.entries(kanto).flatMap(
  ([name, value]) =>
    typeof value === 'function' &&
    value.prototype instanceof HTMLElement &&
    'styles' in value &&
    value.styles
      ? [[name, value as unknown as { styles: CSSResultGroup }] as const]
      : [],
);

function cssTextOf(styles: CSSResultGroup): string {
  const flatten = (group: CSSResultGroup): string =>
    Array.isArray(group)
      ? group.map(flatten).join('\n')
      : String((group as { cssText?: string }).cssText ?? '');
  return flatten(styles);
}

/** Every `selector { … }` block, including those nested inside at-rules. */
function ruleBlocks(cssText: string): { selector: string; body: string }[] {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: { selector: string; body: string }[] = [];

  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1]!.trim().split('\n').pop()!.trim();
    if (selector.startsWith('@')) continue;
    blocks.push({ selector, body: match[2]! });
  }
  return blocks;
}

describe('component stylesheets', () => {
  /**
   * A transition needs something to transition *from*.
   *
   * `outline-color` with no outline declared at rest starts from the initial
   * value — which resolves to the text colour, near-white in the dark theme.
   * Hovering then animates white → grey over 100ms, and reads as a flash of
   * the wrong colour rather than an outline appearing.
   */
  it('declares a resting outline wherever outline-color is transitioned', () => {
    const offenders: string[] = [];

    for (const [tag, element] of ELEMENTS) {
      for (const { selector, body } of ruleBlocks(cssTextOf(element.styles))) {
        const transitionsOutline = /transition:[^;]*outline-color/.test(body);
        if (!transitionsOutline) continue;

        // `outline: none` is not enough: it zeroes the width but leaves the
        // colour at its initial value, so the animation still starts from
        // currentColor.
        const declaresColour =
          /(^|[;{\s])outline-color\s*:/.test(body) ||
          /(^|[;{\s])outline\s*:[^;]*\b(transparent|rgb|hsl|var\()/.test(body);
        if (!declaresColour) offenders.push(`${tag} — ${selector}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  /**
   * `--color-white` over a surface taken from the dark ramp.
   *
   * The ramp inverts between themes: `--color-dark-8` is the darkest surface
   * under `:root` and pure white under `data-theme="light"`, while
   * `--color-white` is near-white in both. Pairing them gives white on white
   * the moment someone switches theme — which is exactly how the code badge and
   * the tooltip disappeared.
   *
   * A recessed or inverted surface is a *role*, so it gets its own token:
   * `--surface-code` / `--text-code`, `--surface-inverted` / `--text-inverted`.
   */
  it('never paints --color-white on a surface from the dark ramp', () => {
    const offenders: string[] = [];

    for (const [tag, element] of ELEMENTS) {
      for (const { selector, body } of ruleBlocks(cssTextOf(element.styles))) {
        const whiteText = /(^|[;{\s])color:\s*var\(--color-white\)/.test(body);
        const rampSurface = /background(-color)?:\s*var\(--color-dark-\d+\)/.test(body);

        if (whiteText && rampSurface) offenders.push(`${tag} — ${selector}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  /**
   * The same trap for borders: a transitioned border-color with no resting
   * border animates from currentColor.
   */
  it('declares a resting border wherever border-color is transitioned', () => {
    const offenders: string[] = [];

    for (const [tag, element] of ELEMENTS) {
      for (const { selector, body } of ruleBlocks(cssTextOf(element.styles))) {
        const transitionsBorder = /transition:[^;]*border-color/.test(body);
        if (!transitionsBorder) continue;

        const declaresBorder = /(^|[;{\s])border(-[a-z]+)?\s*:/.test(body);
        if (!declaresBorder) offenders.push(`${tag} — ${selector}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('checks every exported element, not a hand-picked few', () => {
    expect(ELEMENTS.map(([name]) => name)).toEqual(
      expect.arrayContaining(['KtButton', 'KtChart', 'KtProgressBar', 'KtToast', 'KtTooltip']),
    );
  });

  /**
   * Tokens, not values: a literal colour does not follow the theme, and a
   * literal duration does not follow prefers-reduced-motion, which zeroes the
   * --duration-* tokens. A value inside var() is a fallback and is allowed.
   *
   * Two exceptions. A zero duration is a switch, not a timing. And a looping
   * animation's period is its own rhythm: each element that loops turns the
   * loop off itself under prefers-reduced-motion.
   */
  it('uses no literal colour or duration', () => {
    const offenders: string[] = [];

    for (const [name, element] of ELEMENTS) {
      for (const { selector, body } of ruleBlocks(cssTextOf(element.styles))) {
        for (const declaration of body.split(';')) {
          const value = declaration.slice(declaration.indexOf(':') + 1);
          if (/\binfinite\b/.test(value)) continue;
          const bare = value
            .replace(/(^|[\s,(])0m?s\b/g, '$1')
            .replace(/var\([^()]*(\([^()]*\)[^()]*)*\)/g, '');
          if (/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(|(^|[\s,(])\d*\.?\d+m?s\b/i.test(bare)) {
            offenders.push(`${name} — ${selector} — ${declaration.trim()}`);
          }
        }
      }
    }

    expect(offenders.join('\n')).toBe('');
  });

  /**
   * A field is a fill on --surface-field, which is one ramp step from the page
   * in dark and almost the same colour in light. Without a resting hairline it
   * disappears the moment it sits on a card or in a modal, and reads as a bare
   * native control rather than as a Kanto field.
   */
  it('gives every text field a resting hairline', () => {
    const FIELDS = ['kt-input', 'kt-input-menu', 'kt-select', 'kt-textarea'];

    for (const [name, element] of ELEMENTS) {
      if (!FIELDS.includes(name)) continue;
      const body = cssTextOf(element.styles);

      // A border, not an outline: the control inside fills the field exactly,
      // and a coincident outline is painted over by the native widget.
      expect(body, `${name} has no resting hairline`).toMatch(
        /border:\s*var\(--border-width\)\s+solid\s+var\(--border-field\)/,
      );
    }
  });
});
