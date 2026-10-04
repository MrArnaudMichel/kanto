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
