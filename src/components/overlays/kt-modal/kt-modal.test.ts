import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-modal.js';
import type { KtModal } from 'kanto';

const dialog = (el: KtModal) => el.shadowRoot!.querySelector('dialog')!;
const closeButton = (el: KtModal) =>
  el.shadowRoot!.querySelector<HTMLElement>('kt-button[label="Close"]');

const mount = (attrs = '', body = '<p>Body</p>') =>
  fixture<KtModal>(`<kt-modal heading="Compose" ${attrs}>${body}</kt-modal>`);

describe('kt-modal', () => {
  it('is closed until open is set', async () => {
    const el = await mount();
    expect(dialog(el).open).toBe(false);

    el.open = true;
    await settle(el);
    expect(dialog(el).open).toBe(true);
  });

  it('names the dialog from its heading', async () => {
    const el = await mount();
    expect(dialog(el).getAttribute('aria-label')).toBe('Compose');
    expect(el.shadowRoot!.querySelector('h2')!.textContent).toBe('Compose');
  });

  it('closes from the close button and reports it', async () => {
    const el = await mount('open');
    await settle(el);
    const closed = vi.fn();
    el.addEventListener('kt-close', closed);

    closeButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);

    expect(el.open).toBe(false);
    expect(closed).toHaveBeenCalledOnce();
  });

  it('stays open when the close is cancelled', async () => {
    const el = await mount('open');
    await settle(el);
    el.addEventListener('kt-close', (e) => e.preventDefault());

    closeButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);

    expect(el.open).toBe(true);
    expect(dialog(el).open).toBe(true);
  });

  it('can hide the close button, but Escape still works', async () => {
    const el = await mount('open no-close-button');
    await settle(el);
    expect(closeButton(el)).toBeNull();

    const closed = vi.fn();
    el.addEventListener('kt-close', closed);
    dialog(el).dispatchEvent(new Event('close'));
    await settle(el);

    expect(closed).toHaveBeenCalledOnce();
  });

  it('collapses the footer when nothing is slotted into it', async () => {
    const bare = await mount('open');
    await settle(bare);
    expect(bare.shadowRoot!.querySelector('.footer')!.classList.contains('empty')).toBe(true);

    const acting = await mount('open', '<p>Body</p><button slot="footer">Send</button>');
    await settle(acting);
    expect(acting.shadowRoot!.querySelector('.footer')!.classList.contains('empty')).toBe(false);
  });
});
