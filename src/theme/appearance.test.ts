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
