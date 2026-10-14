/** Where a message sits, and how its thinking moves. */
import { afterEach, describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-chat-message.js';
import type { KtChatMessage } from 'kanto-ds';

const TOKENS = ['--duration-instant', '--duration-fast', '--duration-normal', '--duration-slow'];
afterEach(() => {
  for (const token of TOKENS) document.documentElement.style.removeProperty(token);
});

describe('kt-chat-message, laid out', () => {
  it('sets a person’s bubble against the far side, an assistant’s reply against the near one', async () => {
    const user = await fixture<KtChatMessage>(
      '<kt-chat-message from="user" name="Dana" style="width: 600px">Short</kt-chat-message>',
    );
    const bubble = user.shadowRoot!.querySelector('.bubble')!.getBoundingClientRect();
    expect(Math.abs(bubble.right - user.getBoundingClientRect().right)).toBeLessThan(1);
    expect(bubble.width).toBeLessThan(300);

    const reply = await fixture<KtChatMessage>(
      '<kt-chat-message name="AI" style="width: 600px">Short</kt-chat-message>',
    );
    const avatar = reply.shadowRoot!.querySelector('kt-avatar')!.getBoundingClientRect();
    expect(Math.abs(avatar.left - reply.getBoundingClientRect().left)).toBeLessThan(1);
  });

  it('continues a run of messages from one person without their avatar and name again, lined up with the first', async () => {
    const first = await fixture<KtChatMessage>(
      '<kt-chat-message name="Frank" time="18:00" style="width: 600px">First</kt-chat-message>',
    );
    const next = await fixture<KtChatMessage>(
      '<kt-chat-message continued name="Frank" time="18:01" style="width: 600px">Second</kt-chat-message>',
    );
    expect(next.shadowRoot!.querySelector('kt-avatar')).toBeNull();
    expect(next.shadowRoot!.querySelector('.name')).toBeNull();
    const left = (el: KtChatMessage) =>
      el.shadowRoot!.querySelector('.content')!.getBoundingClientRect().left -
      el.getBoundingClientRect().left;
    expect(Math.abs(left(next) - left(first))).toBeLessThan(1);
    // Its time still there, for whoever asks: in the label.
    expect(next.shadowRoot!.querySelector('time')!.getAttribute('datetime') ?? '').toBe('');
    expect(next.shadowRoot!.querySelector('article')!.getAttribute('aria-label')).toBe('Frank');
  });

  it('moves its thinking dots one after another, and holds them still under reduced motion', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="AI" thinking></kt-chat-message>',
    );
    const dots = [...el.shadowRoot!.querySelectorAll('.dots i')];
    const delays = dots.map((dot) => getComputedStyle(dot).animationDelay);
    expect(new Set(delays).size).toBe(3);
    expect(dots.every((dot) => dot.getAnimations().length === 1)).toBe(true);

    for (const token of TOKENS) document.documentElement.style.setProperty(token, '0s');
    const still = await fixture<KtChatMessage>(
      '<kt-chat-message name="AI" thinking></kt-chat-message>',
    );
    for (const dot of still.shadowRoot!.querySelectorAll('.dots i')) {
      expect(getComputedStyle(dot).animationDuration).toBe('0s');
    }
  });
});
