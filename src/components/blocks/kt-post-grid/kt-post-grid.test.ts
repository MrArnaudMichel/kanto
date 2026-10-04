import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-post-grid.js';
import type { KtPost, KtPostGrid } from 'kanto-ds';

const root = (el: KtPostGrid) => el.shadowRoot!;

const POSTS: KtPost[] = [
  {
    title: 'Closing the month in a day',
    href: '/blog/close',
    excerpt: 'What changed when the bank feed matched itself.',
    date: '2026-09-14',
    image: '/close.jpg',
    imageAlt: '',
    author: { name: 'Ada Park' },
    tags: ['Finance'],
  },
  { title: 'Reminders that get paid', href: '/blog/reminders', date: '2026-08-02' },
];

async function grid(
  markup = '<kt-post-grid heading="From the blog" locale="en-US"></kt-post-grid>',
) {
  const el = await fixture<KtPostGrid>(markup);
  el.posts = POSTS;
  await el.updateComplete;
  return el;
}

const items = (el: KtPostGrid) => [...root(el).querySelectorAll<HTMLElement>('.posts > li')];

describe('kt-post-grid', () => {
  it('is a section named by its heading, each post an article in a list', async () => {
    const el = await grid();
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('From the blog');
    expect(items(el)).toHaveLength(2);
    expect(items(el)[0]!.querySelector('article')).not.toBeNull();
  });

  it('links each post from its title, a level under the heading', async () => {
    const el = await grid();
    const link = items(el)[0]!.querySelector('h3 a')!;
    expect(link.getAttribute('href')).toBe('/blog/close');
    expect(link.textContent!.trim()).toBe('Closing the month in a day');
  });

  it('writes the date for people, in a time element that keeps it for machines', async () => {
    const el = await grid();
    const time = items(el)[0]!.querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe('2026-09-14');
    expect(time.textContent!.trim()).toBe('Sep 14, 2026');
  });

  it('shows the excerpt, the cover, the author and the tags when given', async () => {
    const el = await grid();
    const [first, second] = items(el);
    expect(first!.querySelector('.excerpt')!.textContent).toContain('bank feed');
    expect(first!.querySelector('img')!.getAttribute('src')).toBe('/close.jpg');
    expect(first!.querySelector('.author')!.textContent).toContain('Ada Park');
    expect(first!.querySelector('.tag')!.textContent!.trim()).toBe('Finance');
    expect(second!.querySelector('.excerpt')).toBeNull();
    expect(second!.querySelector('img')).toBeNull();
  });

  it('has three columns by default, and a list layout', async () => {
    const el = await grid();
    expect(el.getAttribute('columns')).toBe('3');
    expect(el.getAttribute('layout')).toBe('grid');
    el.layout = 'list';
    await el.updateComplete;
    expect(el.getAttribute('layout')).toBe('list');
  });

  it('has a slot for a link to every post', async () => {
    const el = await grid();
    expect(root(el).querySelector('slot[name="more"]')).not.toBeNull();
  });
});
