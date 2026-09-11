import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import { registerIcon } from 'kanto-ds';
import './kt-icon.js';
import type { KtIcon } from 'kanto-ds';

const svgOf = (el: KtIcon) => el.shadowRoot!.querySelector('svg')!;

describe('kt-icon', () => {
  it('renders the registered icon paths', async () => {
    const el = await fixture<KtIcon>('<kt-icon name="search"></kt-icon>');
    const svg = svgOf(el);

    expect(svg.querySelectorAll('path, circle, line, rect').length).toBeGreaterThan(0);
    expect(svg.getAttribute('stroke')).toBe('currentColor');
  });

  it('resolves a PascalCase registration through a kebab-case name', async () => {
    registerIcon('SquareDashed', [['rect', { x: '3', y: '3', width: '18', height: '18' }]]);
    const el = await fixture<KtIcon>('<kt-icon name="square-dashed"></kt-icon>');

    expect(svgOf(el).querySelector('rect')).not.toBeNull();
  });

  it('defaults to 24px and honours the size attribute', async () => {
    const el = await fixture<KtIcon>('<kt-icon name="search"></kt-icon>');
    expect(svgOf(el).getAttribute('width')).toBe('24');

    el.size = 16;
    await settle(el);
    expect(svgOf(el).getAttribute('width')).toBe('16');
    expect(svgOf(el).getAttribute('height')).toBe('16');
  });

  it('is hidden from assistive technology unless it is given a label', async () => {
    const plain = await fixture<KtIcon>('<kt-icon name="search"></kt-icon>');
    expect(svgOf(plain).getAttribute('aria-hidden')).toBe('true');
    expect(svgOf(plain).hasAttribute('role')).toBe(false);

    const labelled = await fixture<KtIcon>('<kt-icon name="search" label="Search"></kt-icon>');
    expect(svgOf(labelled).getAttribute('role')).toBe('img');
    expect(svgOf(labelled).getAttribute('aria-label')).toBe('Search');
    expect(svgOf(labelled).hasAttribute('aria-hidden')).toBe(false);
  });

  it('keeps its box and warns once for an unknown name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const el = await fixture<KtIcon>('<kt-icon name="not-a-real-icon" size="20"></kt-icon>');
    expect(svgOf(el).getAttribute('width')).toBe('20');
    expect(svgOf(el).children.length).toBe(0);

    await fixture<KtIcon>('<kt-icon name="not-a-real-icon"></kt-icon>');
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });
});
