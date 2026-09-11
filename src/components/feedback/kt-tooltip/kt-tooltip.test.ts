import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-tooltip.js';
import type { KtTooltip } from 'kanto-ds';

const bubble = (el: KtTooltip) => el.shadowRoot!.querySelector('.bubble')!;
const trigger = (el: KtTooltip) => el.querySelector('button')!;

const mount = (attrs = 'text="Refresh"') =>
  fixture<KtTooltip>(`<kt-tooltip ${attrs}><button>OK</button></kt-tooltip>`);

describe('kt-tooltip', () => {
  it('stays hidden until the trigger is hovered', async () => {
    const el = await mount();
    expect(bubble(el).classList.contains('visible')).toBe(false);
    expect(bubble(el).getAttribute('aria-hidden')).toBe('true');

    el.dispatchEvent(new Event('pointerenter'));
    await settle(el);

    expect(bubble(el).classList.contains('visible')).toBe(true);
    expect(bubble(el).getAttribute('aria-hidden')).toBe('false');
  });

  it('shows on focus and hides on blur', async () => {
    const el = await mount();

    el.dispatchEvent(new Event('focusin'));
    await settle(el);
    expect(bubble(el).classList.contains('visible')).toBe(true);

    el.dispatchEvent(new Event('focusout'));
    await settle(el);
    expect(bubble(el).classList.contains('visible')).toBe(false);
  });

  it('dismisses on Escape, as WCAG 1.4.13 requires', async () => {
    const el = await mount();
    el.dispatchEvent(new Event('pointerenter'));
    await settle(el);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle(el);

    expect(bubble(el).classList.contains('visible')).toBe(false);
  });

  it('describes the trigger through a light-DOM node, since ids do not cross shadow roots', async () => {
    const el = await mount();
    const id = trigger(el).getAttribute('aria-describedby');

    expect(id).toBeTruthy();
    const description = el.querySelector(`#${id}`)!;
    expect(description.textContent).toBe('Refresh');
    // Addressed to a slot that does not exist, so it never renders.
    expect(description.getAttribute('slot')).toBe('kt-tooltip-description');
  });

  it('stays silent when disabled or empty', async () => {
    const off = await mount('text="Refresh" disabled');
    off.dispatchEvent(new Event('pointerenter'));
    await settle(off);
    expect(bubble(off).classList.contains('visible')).toBe(false);

    const empty = await mount('');
    empty.dispatchEvent(new Event('pointerenter'));
    await settle(empty);
    expect(bubble(empty).classList.contains('visible')).toBe(false);
    expect(trigger(empty).hasAttribute('aria-describedby')).toBe(false);
  });
});
