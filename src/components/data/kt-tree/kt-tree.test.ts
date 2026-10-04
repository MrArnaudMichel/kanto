import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-tree.js';
import type { KtTree, KtTreeItem } from 'kanto-ds';

const ITEMS: KtTreeItem[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'components', label: 'components', children: [{ id: 'button', label: 'button.ts' }] },
      { id: 'index', label: 'index.ts' },
    ],
  },
  { id: 'readme', label: 'README.md' },
];

async function mount(markup = '<kt-tree label="Files"></kt-tree>') {
  const el = await fixture<KtTree>(markup);
  el.items = ITEMS;
  await settle(el);
  return el;
}

const rows = (el: KtTree) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const labels = (el: KtTree) =>
  rows(el).map((row) => row.querySelector('.label')!.textContent!.trim());
const focused = (el: KtTree) =>
  el.shadowRoot!.activeElement?.querySelector('.label')?.textContent?.trim();

async function key(el: KtTree, name: string) {
  const target = (el.shadowRoot!.activeElement as HTMLElement) ?? rows(el)[0]!;
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
  );
  await settle(el);
}

describe('kt-tree', () => {
  it('is a named tree showing the top level, closed', async () => {
    const el = await mount();
    const tree = el.shadowRoot!.querySelector('[role="tree"]')!;
    expect(tree.getAttribute('aria-label')).toBe('Files');
    expect(labels(el)).toEqual(['src', 'README.md']);
    expect(rows(el)[0]!.getAttribute('aria-expanded')).toBe('false');
    expect(rows(el)[1]!.hasAttribute('aria-expanded')).toBe(false);
  });

  it('says each node’s level and place among its siblings', async () => {
    const el = await mount();
    el.expanded = ['src'];
    await settle(el);
    const [src, components, index, readme] = rows(el);
    expect(src!.getAttribute('aria-level')).toBe('1');
    expect(components!.getAttribute('aria-level')).toBe('2');
    expect(components!.getAttribute('aria-posinset')).toBe('1');
    expect(index!.getAttribute('aria-setsize')).toBe('2');
    expect(readme!.getAttribute('aria-posinset')).toBe('2');
  });

  it('opens and closes a node from its chevron, and says so', async () => {
    const el = await mount();
    const toggled = vi.fn();
    el.addEventListener('kt-toggle', toggled);
    rows(el)[0]!.querySelector<HTMLElement>('.chevron')!.click();
    await settle(el);
    expect(labels(el)).toEqual(['src', 'components', 'index.ts', 'README.md']);
    expect(toggled.mock.calls[0]![0].detail).toEqual({ id: 'src', expanded: true });
  });

  it('selects a node on a click, and says which', async () => {
    const el = await mount();
    const selected = vi.fn();
    el.addEventListener('kt-select', selected);
    rows(el)[1]!.click();
    await settle(el);
    expect(el.selected).toBe('readme');
    expect(rows(el)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(selected.mock.calls[0]![0].detail).toMatchObject({ id: 'readme' });
  });

  it('keeps one tab stop: the selected node, or the first', async () => {
    const el = await mount();
    expect(rows(el).map((row) => row.tabIndex)).toEqual([0, -1]);
  });

  it('walks the tree from the keyboard, as WAI-ARIA describes', async () => {
    const el = await mount();
    rows(el)[0]!.focus();
    await key(el, 'ArrowRight'); // opens src
    expect(labels(el)).toContain('components');
    expect(focused(el)).toBe('src');
    await key(el, 'ArrowRight'); // into its first child
    expect(focused(el)).toBe('components');
    await key(el, 'ArrowDown');
    expect(focused(el)).toBe('index.ts');
    await key(el, 'ArrowLeft'); // to its parent
    expect(focused(el)).toBe('src');
    await key(el, 'ArrowLeft'); // closes it
    expect(labels(el)).toEqual(['src', 'README.md']);
    await key(el, 'End');
    expect(focused(el)).toBe('README.md');
    await key(el, 'Home');
    expect(focused(el)).toBe('src');
    await key(el, 'Enter');
    expect(el.selected).toBe('src');
  });
});
