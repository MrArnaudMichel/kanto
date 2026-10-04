/** The head over the questions, or beside them when split and wide. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-faq.js';
import type { KtFaq } from 'kanto-ds';

async function mount(width: number, layout: string) {
  const el = await fixture<KtFaq>(
    `<kt-faq heading="Questions" layout="${layout}" style="width: ${width}px"></kt-faq>`,
  );
  el.items = [{ question: 'Can I cancel any time?', answer: 'Yes.' }];
  await el.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const box = (selector: string) => el.shadowRoot!.querySelector(selector)!.getBoundingClientRect();
  return { head: box('.head'), questions: box('.questions') };
}

describe('kt-faq, laid out', () => {
  it('puts the questions under the head when stacked', async () => {
    const { head, questions } = await mount(1100, 'stacked');
    expect(questions.top).toBeGreaterThanOrEqual(head.bottom);
  });

  it('sets the questions beside the head when split and wide, under it when narrow', async () => {
    const wide = await mount(1100, 'split');
    expect(wide.questions.left).toBeGreaterThanOrEqual(wide.head.right);
    const narrow = await mount(600, 'split');
    expect(narrow.questions.top).toBeGreaterThanOrEqual(narrow.head.bottom);
  });
});
