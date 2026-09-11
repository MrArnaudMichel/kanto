import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto/test/fixture';
import './kt-drag-drop.js';
import type { KtDragDrop } from 'kanto';

const zone = (el: KtDragDrop) => el.shadowRoot!.querySelector<HTMLElement>('.zone')!;
const items = (el: KtDragDrop) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('.item')];

const file = (name: string, type = 'image/png', size = 2048) =>
  new File([new Uint8Array(size)], name, { type });

/** Drops files on the zone the way a browser would. */
async function drop(el: KtDragDrop, files: File[]) {
  const transfer = new DataTransfer();
  for (const f of files) transfer.items.add(f);
  const event = new Event('drop', { bubbles: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: transfer });
  zone(el).dispatchEvent(event);
  await settle(el);
}

describe('kt-drag-drop', () => {
  it('is reachable and operable by keyboard', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop></kt-drag-drop>');
    expect(zone(el).getAttribute('role')).toBe('button');
    expect(zone(el).getAttribute('tabindex')).toBe('0');

    const input = el.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    zone(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    zone(el).dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('lists dropped files with their size and type', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop></kt-drag-drop>');
    const changed = vi.fn();
    el.addEventListener('kt-files-change', changed);

    await drop(el, [file('logo.png')]);

    expect(items(el)).toHaveLength(1);
    expect(items(el)[0]!.textContent).toContain('logo.png');
    expect(items(el)[0]!.textContent).toContain('2.0 KB');
    expect(items(el)[0]!.textContent).toContain('image/png');
    expect(changed.mock.calls[0]![0].detail.files).toHaveLength(1);
  });

  it('accumulates drops when multiple, and replaces when not', async () => {
    const many = await fixture<KtDragDrop>('<kt-drag-drop></kt-drag-drop>');
    await drop(many, [file('a.png')]);
    await drop(many, [file('b.png')]);
    expect(many.selectedFiles).toHaveLength(2);

    const one = await fixture<KtDragDrop>('<kt-drag-drop multiple="false"></kt-drag-drop>');
    one.multiple = false;
    await settle(one);
    await drop(one, [file('a.png')]);
    await drop(one, [file('b.png')]);
    expect(one.selectedFiles.map((f) => f.name)).toEqual(['b.png']);
  });

  it('enforces accept on a drop, which the native input never sees', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop accept="image/*"></kt-drag-drop>');
    const rejected = vi.fn();
    el.addEventListener('kt-files-rejected', rejected);

    await drop(el, [file('notes.pdf', 'application/pdf'), file('logo.png')]);

    expect(el.selectedFiles.map((f) => f.name)).toEqual(['logo.png']);
    expect(rejected.mock.calls[0]![0].detail.reason).toBe('type');
  });

  it('matches an extension pattern as well as a mime pattern', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop accept=".pdf"></kt-drag-drop>');
    await drop(el, [file('notes.pdf', 'application/pdf'), file('logo.png')]);
    expect(el.selectedFiles.map((f) => f.name)).toEqual(['notes.pdf']);
  });

  it('rejects files over max-size', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop max-size="1024"></kt-drag-drop>');
    const rejected = vi.fn();
    el.addEventListener('kt-files-rejected', rejected);

    await drop(el, [file('big.png', 'image/png', 4096)]);

    expect(el.selectedFiles).toHaveLength(0);
    expect(rejected.mock.calls[0]![0].detail.reason).toBe('size');
  });

  it('removes one file and leaves the rest', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop></kt-drag-drop>');
    await drop(el, [file('a.png'), file('b.png')]);

    items(el)[0]!.querySelector('kt-button')!.dispatchEvent(new MouseEvent('click'));
    await settle(el);

    expect(el.selectedFiles.map((f) => f.name)).toEqual(['b.png']);
  });

  it('highlights the zone while a drag hovers it', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop></kt-drag-drop>');

    zone(el).dispatchEvent(new Event('dragover', { bubbles: true }));
    await settle(el);
    expect(zone(el).classList.contains('dragover')).toBe(true);

    zone(el).dispatchEvent(new Event('dragleave', { bubbles: true }));
    await settle(el);
    expect(zone(el).classList.contains('dragover')).toBe(false);
  });

  it('clears the whole selection', async () => {
    const el = await fixture<KtDragDrop>('<kt-drag-drop></kt-drag-drop>');
    await drop(el, [file('a.png')]);

    el.clear();
    await settle(el);

    expect(el.selectedFiles).toHaveLength(0);
    expect(items(el)).toHaveLength(0);
  });
});
