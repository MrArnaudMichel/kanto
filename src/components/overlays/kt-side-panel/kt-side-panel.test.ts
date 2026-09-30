import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-side-panel.js';
import type { KtSidePanel } from 'kanto-ds';

const dialog = (el: KtSidePanel) => el.shadowRoot!.querySelector('dialog')!;
const closeButton = (el: KtSidePanel) =>
  el.shadowRoot!.querySelector<HTMLElement>('kt-button[label="Close"]')!;

const mount = (attrs = '') =>
  fixture<KtSidePanel>(`<kt-side-panel heading="Entity 4812" ${attrs}><p>Body</p></kt-side-panel>`);

describe('kt-side-panel', () => {
  it('is closed until open is set', async () => {
    const el = await mount();
    expect(dialog(el).open).toBe(false);

    el.open = true;
    await settle(el);
    expect(dialog(el).open).toBe(true);
  });

  it('renders the eyebrow and heading, and names the dialog', async () => {
    const el = await mount('eyebrow="Modification"');
    expect(el.shadowRoot!.querySelector('.eyebrow')!.textContent).toBe('Modification');
    expect(el.shadowRoot!.querySelector('h2')!.textContent).toBe('Entity 4812');
    expect(dialog(el).getAttribute('aria-label')).toBe('Entity 4812');
  });

  it('closes from the close button and reports it', async () => {
    const el = await mount('open');
    await settle(el);
    const closed = vi.fn();
    el.addEventListener('kt-close', closed);

    closeButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);

    expect(el.open).toBe(false);
    expect(closed).toHaveBeenCalledOnce();
  });

  it('stays open when the close is cancelled', async () => {
    const el = await mount('open');
    await settle(el);
    el.addEventListener('kt-close', (e) => e.preventDefault());

    closeButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);

    expect(el.open).toBe(true);
    expect(dialog(el).open).toBe(true);
  });

  it('treats the native close event as a dismissal', async () => {
    const el = await mount('open');
    await settle(el);
    const closed = vi.fn();
    el.addEventListener('kt-close', closed);

    dialog(el).dispatchEvent(new Event('close'));
    await settle(el);

    expect(closed).toHaveBeenCalledOnce();
    expect(el.open).toBe(false);
  });

  it('names its eyebrow "Details" when it is given none', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('.eyebrow')!.textContent).toBe('Details');
  });

  it('opens itself again when Escape closed the dialog but the close is cancelled', async () => {
    const el = await mount('open');
    await settle(el);
    el.addEventListener('kt-close', (e) => e.preventDefault());

    // Escape closes a modal <dialog> natively, before anyone is asked.
    dialog(el).close();
    await settle(el);

    expect(el.open).toBe(true);
    expect(dialog(el).open).toBe(true);
  });

  describe('a click on the backdrop', () => {
    /** The panel's box: a click outside it landed on the backdrop. */
    const clickAt = (el: KtSidePanel, x: number) => {
      vi.spyOn(dialog(el), 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ x: 600, y: 0, width: 400, height: 800 }),
      );
      dialog(el).dispatchEvent(new MouseEvent('click', { clientX: x, clientY: 100 }));
    };

    it('closes the panel', async () => {
      const el = await mount('open');
      await settle(el);
      clickAt(el, 100);
      await settle(el);
      expect(el.open).toBe(false);
    });

    it('leaves it open with no-backdrop-close', async () => {
      const el = await mount('open no-backdrop-close');
      await settle(el);
      clickAt(el, 100);
      await settle(el);
      expect(el.open).toBe(true);
    });

    it('is not a click inside the panel', async () => {
      const el = await mount('open');
      await settle(el);
      clickAt(el, 800);
      await settle(el);
      expect(el.open).toBe(true);
    });
  });
});
