import { describe, expect, it, vi } from 'vitest';
import { addressOf, go, hrefOf, isSiteLink } from './address.js';

const at = (url: string) => {
  const parsed = new URL(url, 'https://kanto.example');
  return { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash };
};

describe("the site's addresses", () => {
  it('reads a page from its path, and a heading from its hash', () => {
    expect(addressOf(at('/components/kt-button/'))).toEqual({
      section: 'components',
      slug: 'kt-button',
      anchor: '',
      query: '',
      legacy: false,
    });
    expect(addressOf(at('/guide/installation/#no-build-step'))).toMatchObject({
      section: 'guide',
      slug: 'installation',
      anchor: 'no-build-step',
    });
    expect(addressOf(at('/'))).toMatchObject({ section: '', slug: '' });
    expect(addressOf(at('/pro/'))).toMatchObject({ section: 'pro', slug: '' });
  });

  it('takes an old #/ link to its page, its heading and its query kept', () => {
    expect(addressOf(at('/#/components/kt-button'))).toMatchObject({
      section: 'components',
      slug: 'kt-button',
      legacy: true,
    });
    expect(addressOf(at('/#/guide/installation#no-build-step'))).toMatchObject({
      section: 'guide',
      slug: 'installation',
      anchor: 'no-build-step',
      legacy: true,
    });
    expect(addressOf(at('/#/pro/thanks?checkout_id=abc'))).toMatchObject({
      section: 'pro',
      slug: 'thanks',
      query: '?checkout_id=abc',
      legacy: true,
    });
  });

  it('writes a page as a path', () => {
    expect(hrefOf('components', 'kt-button')).toBe('/components/kt-button/');
    expect(hrefOf('home', '')).toBe('/');
    expect(hrefOf('pro', '')).toBe('/pro/');
  });

  it('routes inside the site only what is a page of it', () => {
    const origin = 'https://kanto.example';
    expect(isSiteLink(new URL('/components/kt-button/', origin), origin)).toBe(true);
    expect(isSiteLink(new URL('/live/saas/', origin), origin)).toBe(false);
    expect(isSiteLink(new URL('/llms.txt', origin), origin)).toBe(false);
    expect(isSiteLink(new URL('/pro/home-dark.webp', origin), origin)).toBe(false);
    expect(isSiteLink(new URL('https://github.com/x', origin), origin)).toBe(false);
  });

  it('goes to a page without a reload, and tells the router', () => {
    const push = vi.spyOn(history, 'pushState').mockImplementation(() => {});
    const heard = vi.fn();
    window.addEventListener('popstate', heard);
    go('/guide/installation/');
    window.removeEventListener('popstate', heard);
    expect(push).toHaveBeenCalledWith(null, '', '/guide/installation/');
    expect(heard).toHaveBeenCalledOnce();
    push.mockRestore();
  });
});
