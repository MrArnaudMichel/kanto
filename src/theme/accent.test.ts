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
  const tint = (ground: readonly number[], alpha = 0.12) =>
    ground.map((c, i) => Math.round(base[i]! * alpha + c * (1 - alpha))) as unknown as typeof base;
  // The secondary buttons' hover wash, which accent text also sits on.
  const wash = (ground: readonly number[]) => tint(ground, 0.16);
  const dark20 = surface(0.3074, 0.018, 16.5);
  const light20 = surface(0.9023, 0.0081, 8.2);
  const white = [255, 255, 255] as const;
  return {
    dark: [dark20, tint(dark20), wash(dark20)],
    light: [white, light20, tint(white), tint(light20), wash(white), wash(light20)],
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
    for (const bad of [
      'blue',
      '#12345',
      'rgb(300, 0, 0)',
      'hsl(0 100% 50%)',
      '',
      'oklch(0.5 0.1 .)',
      'rgb(. 1 2)',
    ]) {
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
    // Within 5: the solver also clears the secondary hover wash, which the
    // shipped violet text was not tuned against, so it lands a shade lighter.
    const near = (a: string, b: string) =>
      parseColor(a).every((c, i) => Math.abs(c - parseColor(b)[i]!) <= 5);
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

  it('goes back to the preset it was set over', () => {
    const root = document.createElement('div');
    root.dataset['accent'] = 'blue';
    setAccent('#e11d48', root);
    setAccent(null, root);
    expect(root.dataset['accent']).toBe('blue');
    expect(root.getAttribute('style') ?? '').not.toContain('--accent');
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
