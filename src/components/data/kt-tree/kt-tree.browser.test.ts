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

describe('kt-tree, narrower than its labels', () => {
  it('keeps every row inside the tree, a long label cut with an ellipsis', async () => {
    const el = await fixture<KtTree>(`<kt-tree style="width: 180px"></kt-tree>`);
    el.items = [
      {
        id: 'folder',
        label: 'Folder',
        children: [{ id: 'doc', label: 'A document whose name is far longer than the tree' }],
      },
    ];
    el.expanded = ['folder'];
    await settle(el);
    const tree = el.getBoundingClientRect();
    for (const row of el.shadowRoot!.querySelectorAll<HTMLElement>('[role="treeitem"]')) {
      expect(row.getBoundingClientRect().right).toBeLessThanOrEqual(tree.right + 0.5);
    }
    const label = el.shadowRoot!.querySelectorAll<HTMLElement>('.label')[1]!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  });
});
