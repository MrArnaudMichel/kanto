/**
 * The shell's re-render, shared with the example pages.
 *
 * The examples hold real state — filters, selection, an open panel — and need
 * to repaint when it changes. Rather than each page inventing its own
 * mechanism, the shell registers its update here once and pages call it.
 */
let update: () => void = () => {};

export function setRenderer(fn: () => void): void {
  update = fn;
}

export function rerender(): void {
  update();
}
