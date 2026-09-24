import { describe, expect, it } from 'vitest';
import type { CSSResultGroup } from 'lit';

import { KtButton } from '../components/core/kt-button/kt-button.js';
import { KtCard } from '../components/core/kt-card/kt-card.js';
import { KtChip } from '../components/core/kt-chip/kt-chip.js';
import { KtCode } from '../components/core/kt-code/kt-code.js';
import { KtInput } from '../components/forms/kt-input/kt-input.js';
import { KtInputMenu } from '../components/forms/kt-input-menu/kt-input-menu.js';
import { KtSelect } from '../components/forms/kt-select/kt-select.js';
import { KtTextarea } from '../components/forms/kt-textarea/kt-textarea.js';
import { KtToggle } from '../components/forms/kt-toggle/kt-toggle.js';
import { KtDragDrop } from '../components/forms/kt-drag-drop/kt-drag-drop.js';
import { KtTabs } from '../components/navigation/kt-tabs/kt-tabs.js';
import { KtSegmentedControl } from '../components/navigation/kt-segmented-control/kt-segmented-control.js';
import { KtToggleButton } from '../components/navigation/kt-toggle-button/kt-toggle-button.js';
import { KtTable } from '../components/data/kt-table/kt-table.js';
import { KtDropdown } from '../components/overlays/kt-dropdown/kt-dropdown.js';

const ELEMENTS: readonly [string, { styles: CSSResultGroup }][] = [
  ['kt-button', KtButton],
  ['kt-card', KtCard],
  ['kt-chip', KtChip],
  ['kt-code', KtCode],
  ['kt-input', KtInput],
  ['kt-input-menu', KtInputMenu],
  ['kt-select', KtSelect],
  ['kt-textarea', KtTextarea],
  ['kt-toggle', KtToggle],
  ['kt-drag-drop', KtDragDrop],
  ['kt-tabs', KtTabs],
  ['kt-segmented-control', KtSegmentedControl],
  ['kt-toggle-button', KtToggleButton],
  ['kt-table', KtTable],
  ['kt-dropdown', KtDropdown],
];

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
   * the moment someone switches theme — which is exactly how the code chip and
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
