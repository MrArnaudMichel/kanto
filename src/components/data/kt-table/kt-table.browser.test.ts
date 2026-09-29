/**
 * The virtual table, in a real browser: what it renders depends on measured
 * row heights and on scrolling, neither of which a simulated DOM has.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-table.js';
import type { KtTable, KtTableRow } from 'kanto-ds';

const COUNT = 5000;
const ROWS: KtTableRow[] = Array.from({ length: COUNT }, (_, i) => ({ id: i, name: `Row ${i}` }));

/** A render, a frame for layout and the resize observer, and the render that follows. */
async function frame(el: KtTable): Promise<void> {
  await settle(el);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle(el);
}

async function mount(attributes = ''): Promise<KtTable> {
  const el = await fixture<KtTable>(
    `<kt-table virtual ${attributes} style="height: 400px"></kt-table>`,
  );
  el.columns = [{ key: 'name', label: 'Name' }];
  el.data = ROWS;
  await frame(el);
  await frame(el);
  return el;
}

const rows = (el: KtTable) => [...el.shadowRoot!.querySelectorAll('tbody tr[part="row"]')];
const scroller = (el: KtTable) => el.shadowRoot!.querySelector<HTMLElement>('.scroller')!;
const rowHeight = (el: KtTable) => rows(el)[0]!.getBoundingClientRect().height;

describe('kt-table virtual', () => {
  it('renders only the rows in view, out of five thousand', async () => {
    const el = await mount();

    expect(rows(el).length).toBeGreaterThan(5);
    expect(rows(el).length).toBeLessThan(60);
    expect(el.shadowRoot!.querySelector('table')!.getAttribute('aria-rowcount')).toBe(
      String(COUNT + 1),
    );
  });

  it('keeps the height of every row to scroll through', async () => {
    const el = await mount();
    const expected = COUNT * rowHeight(el);

    expect(scroller(el).scrollHeight).toBeGreaterThan(expected);
    expect(scroller(el).scrollHeight).toBeLessThan(expected + 100);
  });

  it('shows the rows under the viewport after a scroll, numbered for screen readers', async () => {
    const el = await mount();
    const target = Math.floor(20_000 / rowHeight(el));

    scroller(el).scrollTop = 20_000;
    scroller(el).dispatchEvent(new Event('scroll'));
    await frame(el);

    const row = rows(el).find((candidate) => candidate.textContent!.trim() === `Row ${target}`);
    expect(row, `Row ${target} is rendered`).toBeDefined();
    // The header row is row 1.
    expect(row!.getAttribute('aria-rowindex')).toBe(String(target + 2));
  });

  it('selects every row from the header box, not only those on screen', async () => {
    const el = await mount('selectable');

    el.shadowRoot!.querySelector<HTMLInputElement>('thead input')!.click();
    await frame(el);

    expect(el.selected).toHaveLength(COUNT);
  });

  it('pages instead when it has a page size', async () => {
    const el = await mount('page-size="10"');

    expect(rows(el)).toHaveLength(10);
    expect(el.shadowRoot!.querySelector('kt-pagination')).not.toBeNull();
  });
});
