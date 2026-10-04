/** Posts in columns when wide, stacked when narrow; in a list, the cover beside the words. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-post-grid.js';
import type { KtPostGrid } from 'kanto-ds';

const IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"/>');

async function mount(width: number, layout = 'grid') {
  const el = await fixture<KtPostGrid>(
    `<kt-post-grid layout="${layout}" style="width: ${width}px"></kt-post-grid>`,
  );
  el.posts = [1, 2, 3].map((n) => ({ title: `Post ${n}`, href: `#${n}`, image: IMAGE }));
  await el.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

const boxes = (el: KtPostGrid, selector: string) =>
  [...el.shadowRoot!.querySelectorAll(selector)].map((node) => node.getBoundingClientRect());

describe('kt-post-grid, laid out', () => {
  it('sets three posts in a row when wide, one under another when narrow', async () => {
    const [a, b, c] = boxes(await mount(1000), '.posts > li');
    expect(b!.top).toBe(a!.top);
    expect(c!.left).toBeGreaterThan(b!.right);
    const [d, e] = boxes(await mount(400), '.posts > li');
    expect(e!.top).toBeGreaterThanOrEqual(d!.bottom);
  });

  it('puts the cover beside the words in a list', async () => {
    const el = await mount(900, 'list');
    const [cover] = boxes(el, '.cover');
    const [body] = boxes(el, '.body');
    expect(body!.left).toBeGreaterThanOrEqual(cover!.right);
  });
});
