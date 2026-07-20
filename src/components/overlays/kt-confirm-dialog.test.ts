import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-confirm-dialog.js';
import type { KtConfirmDialog } from './kt-confirm-dialog.js';

const dialog = (el: KtConfirmDialog) => el.shadowRoot!.querySelector('dialog')!;
const buttons = (el: KtConfirmDialog) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('.actions kt-button'),
];
const press = (button: HTMLElement) =>
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

const mount = (attrs = '') =>
  fixture<KtConfirmDialog>(
    `<kt-confirm-dialog heading="Delete this entity?" message="This action cannot be undone." ${attrs}></kt-confirm-dialog>`,
  );

describe('kt-confirm-dialog', () => {
  it('is an alertdialog describing its own message', async () => {
    const el = await mount();
    expect(dialog(el).getAttribute('role')).toBe('alertdialog');
    expect(dialog(el).getAttribute('aria-label')).toBe('Delete this entity?');
    expect(dialog(el).getAttribute('aria-describedby')).toBe('kt-confirm-message');
  });

  it('confirms and closes', async () => {
    const el = await mount('open');
    await settle(el);
    const confirmed = vi.fn();
    el.addEventListener('kt-confirm', confirmed);

    press(buttons(el)[1]!);
    await settle(el);

    expect(confirmed).toHaveBeenCalledOnce();
    expect(el.open).toBe(false);
  });

  it('cancels and closes', async () => {
    const el = await mount('open');
    await settle(el);
    const cancelled = vi.fn();
    el.addEventListener('kt-cancel', cancelled);

    press(buttons(el)[0]!);
    await settle(el);

    expect(cancelled).toHaveBeenCalledOnce();
    expect(el.open).toBe(false);
  });

  it('reports Escape as a cancel, never as a confirm', async () => {
    const el = await mount('open');
    await settle(el);
    const cancelled = vi.fn();
    const confirmed = vi.fn();
    el.addEventListener('kt-cancel', cancelled);
    el.addEventListener('kt-confirm', confirmed);

    dialog(el).dispatchEvent(new Event('close'));
    await settle(el);

    expect(cancelled).toHaveBeenCalledOnce();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('gives the confirm button the solid red treatment for danger', async () => {
    const danger = await mount();
    expect(buttons(danger)[1]!.getAttribute('variant')).toBe('delete');

    const benign = await mount('variant="primary"');
    expect(buttons(benign)[1]!.getAttribute('variant')).toBe('primary');
  });

  it('uses the supplied labels', async () => {
    const el = await mount('confirm-label="Delete" cancel-label="Keep"');
    expect(buttons(el)[0]!.textContent).toContain('Keep');
    expect(buttons(el)[1]!.textContent).toContain('Delete');
  });
});
