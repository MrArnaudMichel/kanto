import { beforeEach, describe, expect, it } from 'vitest';
import { applyMeta, SITE } from './meta.js';

const content = (selector: string) =>
  document.head.querySelector(selector)?.getAttribute('content');

describe('the meta of a page', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title>Kanto</title>
      <meta name="description" content="The site" />
      <meta property="og:title" content="Kanto" />
      <meta property="og:description" content="The site" />
      <meta property="og:url" content="${SITE}/" />`;
  });

  it('names the page, says what it holds and gives its one address', () => {
    applyMeta({
      title: 'button — Kanto',
      description: 'A button.',
      path: '/components/kt-button',
      indexed: true,
    });
    expect(document.title).toBe('button — Kanto');
    expect(content('meta[name="description"]')).toBe('A button.');
    expect(content('meta[property="og:title"]')).toBe('button — Kanto');
    expect(content('meta[property="og:description"]')).toBe('A button.');
    expect(content('meta[property="og:url"]')).toBe(`${SITE}/components/kt-button`);
    expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute('href')).toBe(
      `${SITE}/components/kt-button`,
    );
  });

  it('keeps one canonical link from page to page', () => {
    applyMeta({ title: 'a', description: 'a', path: '/guide/introduction', indexed: true });
    applyMeta({ title: 'b', description: 'b', path: '/', indexed: true });
    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute('href')).toBe(`${SITE}/`);
  });

  it('keeps a page out of search engines only while it is shown', () => {
    applyMeta({
      title: 'Thank you — Kanto',
      description: 'x',
      path: '/pro/thanks',
      indexed: false,
    });
    expect(content('meta[name="robots"]')).toBe('noindex');
    applyMeta({ title: 'Pro', description: 'x', path: '/pro', indexed: true });
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
