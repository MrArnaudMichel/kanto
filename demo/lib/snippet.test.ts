import { describe, expect, it } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { htmlSnippet, jsSnippet } from './snippet.js';

const with_ = (patch: object) => ({ ...KT_DEFAULT_APPEARANCE, ...patch });

describe('htmlSnippet', () => {
  it('is a bare <html> for Kanto as it ships', () => {
    expect(htmlSnippet(KT_DEFAULT_APPEARANCE)).toBe('<html>');
  });

  it('lists only what differs, in a fixed order', () => {
    expect(
      htmlSnippet(with_({ textSize: 'large', accent: 'teal', theme: 'light', font: 'inter' })),
    ).toBe('<html data-theme="light" data-accent="teal" data-font="inter" data-text-size="large">');
  });

  it('cannot carry a custom colour in an attribute, so says where it goes', () => {
    expect(htmlSnippet(with_({ accent: '#e11d48', radius: 'round' }))).toBe(
      '<html data-radius="round">\n<!-- and in a script: setAccent(\'#e11d48\') -->',
    );
  });
});

describe('jsSnippet', () => {
  it('imports and calls setAppearance with what differs', () => {
    expect(jsSnippet(with_({ accent: '#e11d48', density: 'compact' }))).toBe(
      "import { setAppearance } from 'kanto-ds';\n\nsetAppearance({ accent: '#e11d48', density: 'compact' });",
    );
  });

  it('says so when there is nothing to change', () => {
    expect(jsSnippet(KT_DEFAULT_APPEARANCE)).toBe(
      "import { setAppearance } from 'kanto-ds';\n\nsetAppearance({}); // Kanto as it ships",
    );
  });
});
