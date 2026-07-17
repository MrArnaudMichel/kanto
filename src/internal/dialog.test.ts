import { describe, expect, it, vi } from 'vitest';
import { closeDialog, isBackdropClick, openModal } from './dialog.js';

/**
 * A stand-in for `<dialog>`, since neither happy-dom nor jsdom implements
 * showModal — which is exactly why these helpers are guarded, so the guards
 * need testing in both directions.
 */
function fakeDialog(options: { modal?: boolean; box?: DOMRect } = {}): HTMLDialogElement {
  const element = document.createElement('div') as unknown as HTMLDialogElement;

  // A real <dialog> reflects `open` to and from the attribute, which is what
  // makes the attribute fallback work at all — so the double must too.
  Object.defineProperty(element, 'open', {
    get: () => element.hasAttribute('open'),
    set: (value: boolean) => {
      if (value) element.setAttribute('open', '');
      else element.removeAttribute('open');
    },
    configurable: true,
  });

  if (options.modal !== false) {
    element.showModal = vi.fn(() => element.setAttribute('open', ''));
    element.close = vi.fn(() => element.removeAttribute('open'));
  }

  if (options.box) element.getBoundingClientRect = () => options.box!;
  return element;
}

const box = (over: Partial<DOMRect> = {}): DOMRect =>
  ({
    top: 100,
    bottom: 300,
    left: 100,
    right: 400,
    width: 300,
    height: 200,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  }) as DOMRect;

describe('openModal', () => {
  it('uses showModal where the platform has it', () => {
    const dialog = fakeDialog();
    openModal(dialog);

    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
  });

  it('falls back to the open attribute where it does not', () => {
    const dialog = fakeDialog({ modal: false });
    openModal(dialog);

    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('does nothing to an already-open dialog', () => {
    const dialog = fakeDialog();
    openModal(dialog);
    openModal(dialog);

    expect(dialog.showModal).toHaveBeenCalledOnce();
  });
});

describe('closeDialog', () => {
  it('closes an open dialog, and leaves a closed one alone', () => {
    const dialog = fakeDialog();
    closeDialog(dialog);
    expect(dialog.close).not.toHaveBeenCalled();

    openModal(dialog);
    closeDialog(dialog);
    expect(dialog.close).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(false);
  });

  it('falls back to removing the attribute', () => {
    const dialog = fakeDialog({ modal: false });
    openModal(dialog);
    closeDialog(dialog);

    expect(dialog.hasAttribute('open')).toBe(false);
  });
});

describe('isBackdropClick', () => {
  const dialog = fakeDialog({ box: box() });

  const clickAt = (x: number, y: number, target: EventTarget = dialog) =>
    ({ target, clientX: x, clientY: y }) as unknown as MouseEvent;

  it('is true outside the dialog box', () => {
    expect(isBackdropClick(dialog, clickAt(50, 200))).toBe(true);
    expect(isBackdropClick(dialog, clickAt(500, 200))).toBe(true);
    expect(isBackdropClick(dialog, clickAt(200, 50))).toBe(true);
    expect(isBackdropClick(dialog, clickAt(200, 400))).toBe(true);
  });

  it('is false inside it', () => {
    expect(isBackdropClick(dialog, clickAt(200, 200))).toBe(false);
  });

  it('is false when the click came from something inside the dialog', () => {
    const button = document.createElement('button');
    expect(isBackdropClick(dialog, clickAt(50, 50, button))).toBe(false);
  });

  it('is false for an unlaid-out dialog, rather than dismissing on any click', () => {
    const collapsed = fakeDialog({ box: { ...box(), width: 0, height: 0 } as DOMRect });
    expect(isBackdropClick(collapsed, clickAt(0, 0, collapsed))).toBe(false);
  });
});
