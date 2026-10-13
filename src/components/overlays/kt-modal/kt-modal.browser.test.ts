/** The modal in a real browser: what its scrolling body leaves room for. */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-modal.js';
import '../../forms/kt-input/kt-input.js';
import type { KtModal } from 'kanto-ds';

describe('kt-modal, open', () => {
  it("leaves room for a field's focus ring inside its scrolling body", async () => {
    const el = await fixture<KtModal>(
      '<kt-modal heading="Invite someone" open><kt-input label="Email"></kt-input></kt-modal>',
    );
    await settle(el);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const body = el.shadowRoot!.querySelector('.body')!.getBoundingClientRect();
    const field = el.querySelector('kt-input')!.getBoundingClientRect();
    expect(field.left - body.left).toBeGreaterThanOrEqual(2);
    expect(body.right - field.right).toBeGreaterThanOrEqual(2);
  });
});
