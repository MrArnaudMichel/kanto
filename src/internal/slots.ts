/**
 * Knowing whether a slot actually received anything.
 *
 * CSS cannot answer this. A wrapper around `<slot>` always has one element
 * child — the slot itself — so `:has(*)` matches whether or not anything was
 * assigned, and `:empty` looks at the slot's *fallback* children rather than
 * its assigned nodes. Both read as working and neither does.
 */

/** True when the slot has assigned elements, or non-whitespace assigned text. */
export function hasAssignedContent(slot: HTMLSlotElement | null | undefined): boolean {
  if (!slot) return false;
  if (slot.assignedElements({ flatten: true }).length > 0) return true;

  return slot
    .assignedNodes({ flatten: true })
    .some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
}
