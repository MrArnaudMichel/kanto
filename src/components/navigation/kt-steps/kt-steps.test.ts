import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-steps.js';
import type { KtSteps } from 'kanto-ds';

const STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing', description: 'Card or invoice' },
  { id: 'team', label: 'Team' },
  { id: 'done', label: 'Done' },
];

async function mount(attributes = 'current="billing"') {
  const el = await fixture<KtSteps>(`<kt-steps label="Sign-up" ${attributes}></kt-steps>`);
  el.steps = STEPS;
  await settle(el);
  return el;
}

const items = (el: KtSteps) => [...el.shadowRoot!.querySelectorAll('li')];

describe('kt-steps', () => {
  it('is an ordered list named by its label', async () => {
    const el = await mount();
    const list = el.shadowRoot!.querySelector('ol')!;
    expect(list.getAttribute('aria-label')).toBe('Sign-up');
    expect(items(el)).toHaveLength(4);
  });

  it('marks steps before the current one complete, it current, the rest upcoming', async () => {
    const el = await mount();
    expect(items(el).map((li) => li.dataset['state'])).toEqual([
      'complete',
      'current',
      'upcoming',
      'upcoming',
    ]);
    expect(items(el)[1]!.getAttribute('aria-current')).toBe('step');
  });

  it('says each state in words, for a screen reader', async () => {
    const el = await mount();
    expect(items(el)[0]!.textContent).toContain('Completed');
    expect(items(el)[2]!.textContent).toContain('Not started');
  });

  it('shows a step in error, whatever its place', async () => {
    const el = await mount('current="team"');
    el.steps = STEPS.map((step) => (step.id === 'billing' ? { ...step, error: true } : step));
    await settle(el);
    expect(items(el)[1]!.dataset['state']).toBe('error');
    expect(items(el)[1]!.textContent).toContain('Needs attention');
  });

  it('numbers the steps, and shows a tick for a completed one', async () => {
    const el = await mount();
    expect(items(el)[0]!.querySelector('kt-icon')!.getAttribute('name')).toBe('check');
    expect(items(el)[2]!.querySelector('.marker')!.textContent!.trim()).toBe('3');
  });

  it('goes back to a completed step when navigable, never forward', async () => {
    const el = await mount('current="team" navigable');
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    const buttons = el.shadowRoot!.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    (buttons[0] as HTMLButtonElement).click();
    expect(changed.mock.calls[0]![0].detail).toEqual({ id: 'account' });
    expect(el.current).toBe('account');
  });

  it('is plain text, without buttons, unless navigable', async () => {
    const el = await mount('current="team"');
    expect(el.shadowRoot!.querySelectorAll('button')).toHaveLength(0);
  });

  it('lays out down the page when vertical', async () => {
    const el = await mount('orientation="vertical"');
    expect(el.getAttribute('orientation')).toBe('vertical');
    expect(items(el)[1]!.textContent).toContain('Card or invoice');
  });
});
