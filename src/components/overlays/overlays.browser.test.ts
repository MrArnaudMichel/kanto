/**
 * Overlays in a real browser.
 *
 * Whether a dialog intercepts clicks is a question of layout, the top layer
 * and hit testing — none of which a simulated DOM computes. A closed
 * `<kt-confirm-dialog>` once sat invisible over a page and swallowed every
 * click beneath it, with the whole happy-dom suite green.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../styles.css';
import './kt-modal/kt-modal.js';
import './kt-confirm-dialog/kt-confirm-dialog.js';
import type { KtConfirmDialog, KtModal } from 'kanto-ds';

type Dialog = KtModal | KtConfirmDialog;

const probes: HTMLButtonElement[] = [];
afterEach(() => {
  for (const probe of probes.splice(0)) probe.remove();
});

/**
 * A page button, placed over `area` when given, else mid-viewport.
 *
 * A closed dialog that still has a box keeps it wherever normal flow put it,
 * so the button has to sit exactly there for a stray hit target to show.
 */
function pageButton(area?: DOMRect): HTMLButtonElement {
  const button = document.createElement('button');
  probes.push(button);
  button.textContent = 'Underneath';
  button.style.cssText =
    area && area.width > 0 && area.height > 0
      ? `position: fixed; left: ${area.left}px; top: ${area.top}px; width: ${area.width}px; height: ${area.height}px;`
      : 'position: fixed; inset: 40% 30%;';
  document.body.prepend(button);
  return button;
}

/** The native `<dialog>` inside the element. */
const inner = (dialog: Dialog) => dialog.shadowRoot!.querySelector('dialog')!;

/** The element a click at the centre of `target` would land on. */
function hit(target: Element): Element | null {
  const box = target.getBoundingClientRect();
  return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
}

/** Resolves once every transition inside the dialog has finished. */
async function transitionsDone(dialog: Dialog): Promise<void> {
  await settle(dialog);
  const animations = dialog.shadowRoot!.getAnimations();
  await Promise.all(animations.map((animation) => animation.finished));
}

describe.each([
  ['kt-modal', '<kt-modal heading="Edit"><p>Body</p></kt-modal>'],
  ['kt-confirm-dialog', '<kt-confirm-dialog message="Delete it?"></kt-confirm-dialog>'],
])('<%s> and the page beneath it', (_, markup) => {
  it('lets clicks through while it has never been opened', async () => {
    const dialog = await fixture<Dialog>(markup);
    const button = pageButton(inner(dialog).getBoundingClientRect());

    expect(hit(button)).toBe(button);
  });

  it('blocks the page while open, and lets clicks through again once closed', async () => {
    const button = pageButton();
    const dialog = await fixture<Dialog>(markup);

    dialog.open = true;
    await transitionsDone(dialog);
    expect(hit(button)).not.toBe(button);

    dialog.open = false;
    await transitionsDone(dialog);
    button.remove();
    const after = pageButton(inner(dialog).getBoundingClientRect());
    expect(hit(after)).toBe(after);
  });
});
