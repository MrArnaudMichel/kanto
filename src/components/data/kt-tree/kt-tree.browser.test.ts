/** Walking the tree from a real keyboard, and its rows indented by level. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-tree.js';
import type { KtTree } from 'kanto-ds';

async function mount() {
  const el = await fixture<KtTree>('<kt-tree label="Files" style="width: 320px"></kt-tree>');
  el.items = [
    { id: 'src', label: 'src', children: [{ id: 'index', label: 'index.ts' }] },
    { id: 'readme', label: 'README.md' },
  ];
  await settle(el);
  return el;
}

const label = (el: KtTree) =>
  el.shadowRoot!.activeElement?.querySelector('.label')?.textContent?.trim();

describe('kt-tree, from the keyboard', () => {
  it('takes one Tab, then walks with the arrows, opening and closing', async () => {
    const el = await mount();
    const before = document.createElement('button');
    before.textContent = 'before';
    el.before(before);
    before.focus();
    await userEvent.keyboard('{Tab}');
    expect(label(el)).toBe('src');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(label(el)).toBe('index.ts');
    await userEvent.keyboard('{ArrowDown}');
    expect(label(el)).toBe('README.md');
    await userEvent.keyboard('{Tab}');
    expect(el.shadowRoot!.activeElement).toBeNull();
    before.remove();
  });

  it('indents a child under its parent', async () => {
    const el = await mount();
    el.expanded = ['src'];
    await settle(el);
    const [parent, child] = [...el.shadowRoot!.querySelectorAll('.label')].map((node) =>
      node.getBoundingClientRect(),
    );
    expect(child!.left - parent!.left).toBeGreaterThanOrEqual(19);
  });
});
