import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-avatar.js';
import { initialsOf, type KtAvatar } from './kt-avatar.js';

const base = (el: KtAvatar) => el.shadowRoot!.querySelector<HTMLElement>('.avatar')!;

describe('initialsOf', () => {
  it('takes the first and last word', () => {
    expect(initialsOf('Benjamin Canac')).toBe('BC');
    expect(initialsOf('Ada Byron King Lovelace')).toBe('AL');
  });

  it('takes two letters from a single word', () => {
    expect(initialsOf('Kanto')).toBe('KA');
  });

  it('reads an email address as a name', () => {
    expect(initialsOf('emma.davis@example.com')).toBe('ED');
  });

  it('returns nothing it cannot derive', () => {
    expect(initialsOf('')).toBe('');
  });
});

describe('kt-avatar', () => {
  it('falls back to initials with no image', async () => {
    const el = await fixture<KtAvatar>('<kt-avatar name="Benjamin Canac"></kt-avatar>');
    expect(base(el).textContent!.trim()).toBe('BC');
    expect(base(el).getAttribute('aria-label')).toBe('Benjamin Canac');
  });

  it('gives the same name the same colour every time', async () => {
    const a = await fixture<KtAvatar>('<kt-avatar name="Emma Davis"></kt-avatar>');
    const b = await fixture<KtAvatar>('<kt-avatar name="Emma Davis"></kt-avatar>');
    const c = await fixture<KtAvatar>('<kt-avatar name="Frank Nguyen"></kt-avatar>');

    expect(base(a).getAttribute('style')).toBe(base(b).getAttribute('style'));
    expect(base(a).getAttribute('style')).not.toBe(base(c).getAttribute('style'));
  });

  it('shows the image when it loads, and the initials when it does not', async () => {
    const el = await fixture<KtAvatar>('<kt-avatar name="Emma Davis" src="/e.jpg"></kt-avatar>');
    expect(el.shadowRoot!.querySelector('img')).not.toBeNull();

    el.shadowRoot!.querySelector('img')!.dispatchEvent(new Event('error'));
    await settle(el);

    expect(el.shadowRoot!.querySelector('img')).toBeNull();
    expect(base(el).textContent!.trim()).toBe('ED');
  });

  it('tries again when the source changes', async () => {
    const el = await fixture<KtAvatar>('<kt-avatar name="Emma" src="/a.jpg"></kt-avatar>');
    el.shadowRoot!.querySelector('img')!.dispatchEvent(new Event('error'));
    await settle(el);
    expect(el.shadowRoot!.querySelector('img')).toBeNull();

    el.src = '/b.jpg';
    await settle(el);
    expect(el.shadowRoot!.querySelector('img')).not.toBeNull();
  });

  it('shows a presence dot only when asked', async () => {
    const plain = await fixture<KtAvatar>('<kt-avatar name="Emma"></kt-avatar>');
    expect(plain.shadowRoot!.querySelector('.status')).toBeNull();

    const online = await fixture<KtAvatar>('<kt-avatar name="Emma" status="online"></kt-avatar>');
    expect(online.shadowRoot!.querySelector('.status')!.classList.contains('online')).toBe(true);
  });
});
