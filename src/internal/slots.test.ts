import { describe, expect, it } from 'vitest';
import { hasAssignedContent } from './slots.js';

/** A host whose shadow root holds one default slot, filled with `light`. */
function slotWith(light: string): HTMLSlotElement {
  const host = document.createElement('div');
  host.attachShadow({ mode: 'open' }).innerHTML = '<slot>fallback</slot>';
  host.innerHTML = light;
  document.body.append(host);
  return host.shadowRoot!.querySelector('slot')!;
}

describe('hasAssignedContent', () => {
  it('is false for no slot at all', () => {
    expect(hasAssignedContent(null)).toBe(false);
    expect(hasAssignedContent(undefined)).toBe(false);
  });

  it('is true for an assigned element', () => {
    expect(hasAssignedContent(slotWith('<span></span>'))).toBe(true);
  });

  it('is true for assigned text', () => {
    expect(hasAssignedContent(slotWith('Some text'))).toBe(true);
  });

  it('is false for whitespace alone, which a template leaves between tags', () => {
    expect(hasAssignedContent(slotWith('\n   \n'))).toBe(false);
  });

  it('is false for nothing assigned, whatever the fallback holds', () => {
    expect(hasAssignedContent(slotWith(''))).toBe(false);
  });
});
