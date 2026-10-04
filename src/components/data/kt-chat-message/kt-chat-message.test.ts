import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-chat-message.js';
import type { KtChatMessage } from 'kanto-ds';

const root = (el: KtChatMessage) => el.shadowRoot!;

describe('kt-chat-message', () => {
  it('is an article named by its author', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="Northwind AI">Here is the summary.</kt-chat-message>',
    );
    const article = root(el).querySelector('article')!;
    expect(article.getAttribute('aria-label')).toBe('Northwind AI');
  });

  it('shows an assistant beside its avatar, without a bubble', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="Northwind AI">Done.</kt-chat-message>',
    );
    expect(el.getAttribute('from')).toBe('assistant');
    expect(root(el).querySelector('kt-avatar')!.getAttribute('name')).toBe('Northwind AI');
    expect(root(el).querySelector('.bubble')).toBeNull();
  });

  it('shows a person in a bubble, without an avatar', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message from="user" name="Dana">What changed this week?</kt-chat-message>',
    );
    expect(root(el).querySelector('.bubble')).not.toBeNull();
    expect(root(el).querySelector('kt-avatar')).toBeNull();
  });

  it('takes a picture for the avatar', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="Bot" avatar="/bot.png">Hi</kt-chat-message>',
    );
    expect(root(el).querySelector('kt-avatar')!.getAttribute('src')).toBe('/bot.png');
  });

  it('says it is thinking, in dots and in words, until it has words of its own', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="AI" thinking></kt-chat-message>',
    );
    expect(root(el).querySelector('.dots')).not.toBeNull();
    expect(root(el).querySelector('.visually-hidden')!.textContent).toContain('Thinking');
    expect(root(el).querySelector('article')!.getAttribute('aria-busy')).toBe('true');
    expect(root(el).querySelector<HTMLElement>('.content')!.hidden).toBe(true);

    el.thinking = false;
    await settle(el);
    expect(root(el).querySelector('.dots')).toBeNull();
    expect(root(el).querySelector<HTMLElement>('.content')!.hidden).toBe(false);
  });

  it('marks the end of a reply still arriving, and says it is busy', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="AI" streaming>The revenue rose</kt-chat-message>',
    );
    expect(root(el).querySelector('.caret')).not.toBeNull();
    expect(root(el).querySelector('article')!.getAttribute('aria-busy')).toBe('true');
    el.streaming = false;
    await settle(el);
    expect(root(el).querySelector('.caret')).toBeNull();
    expect(root(el).querySelector('article')!.hasAttribute('aria-busy')).toBe(false);
  });

  it('puts its time in a <time>', async () => {
    const el = await fixture<KtChatMessage>(
      '<kt-chat-message name="AI" time="09:41" datetime="2026-10-04T09:41">Hi</kt-chat-message>',
    );
    const time = root(el).querySelector('time')!;
    expect(time.textContent!.trim()).toBe('09:41');
    expect(time.getAttribute('datetime')).toBe('2026-10-04T09:41');
  });

  it('has a slot for actions, and one for the avatar', async () => {
    const el = await fixture<KtChatMessage>('<kt-chat-message>Hi</kt-chat-message>');
    const names = [...root(el).querySelectorAll('slot')].map((slot) => slot.name);
    expect(names).toEqual(expect.arrayContaining(['actions', 'avatar']));
  });
});
