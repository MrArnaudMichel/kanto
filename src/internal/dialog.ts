/**
 * Helpers for elements built on the native `<dialog>`.
 *
 * `showModal()` is worth the trouble: it puts the dialog in the top layer
 * (above every stacking context, which no z-index can guarantee), traps focus,
 * makes the rest of the page inert, and handles Escape. Rebuilding that by
 * hand — and every design system has tried — produces a focus trap that leaks.
 *
 * The calls are guarded because test DOMs implement `<dialog>` only partially.
 */

/** Opens `dialog` modally, falling back to a non-modal open where it is unsupported. */
export function openModal(dialog: HTMLDialogElement): void {
  if (dialog.open) return;

  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
}

/** Closes `dialog`, whichever way it was opened. */
export function closeDialog(dialog: HTMLDialogElement): void {
  if (!dialog.open) return;

  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
}

/**
 * True when a click at these coordinates landed on the backdrop rather than on
 * the dialog itself.
 *
 * A click on `::backdrop` is reported as a click on the dialog element, so the
 * only way to tell them apart is to compare against its box.
 */
export function isBackdropClick(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.target !== dialog) return false;

  const box = dialog.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return false;

  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}
