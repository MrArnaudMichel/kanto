import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-blog-post.js';
import type { KtBlogPost } from 'kanto-ds';

const root = (el: KtBlogPost) => el.shadowRoot!;

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('kt-blog-post', () => {
  it('is an article named by its title, an h1, with its lead', async () => {
    const el = await fixture<KtBlogPost>(
      '<kt-blog-post heading="Closing the month in a day" lead="What changed."><p>Body.</p></kt-blog-post>',
    );
    const article = root(el).querySelector('article')!;
    const label = root(el).getElementById(article.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Closing the month in a day');
    expect(root(el).querySelector('h1')).not.toBeNull();
    expect(root(el).querySelector('.lead')!.textContent).toBe('What changed.');
  });

  it('says who wrote it and when, the date in a time element', async () => {
    const el = await fixture<KtBlogPost>(
      '<kt-blog-post heading="x" author="Ada Park" author-role="CFO" date="2026-09-14" locale="en-US"></kt-blog-post>',
    );
    expect(root(el).querySelector('.author-name')!.textContent!.trim()).toBe('Ada Park');
    expect(root(el).querySelector('.author-role')!.textContent!.trim()).toBe('CFO');
    const time = root(el).querySelector('time')!;
    expect(time.getAttribute('datetime')).toBe('2026-09-14');
    expect(time.textContent!.trim()).toBe('Sep 14, 2026');
  });

  it('counts the reading time from its text, or takes one', async () => {
    const el = await fixture<KtBlogPost>(
      `<kt-blog-post heading="x"><p>${words(700)}</p></kt-blog-post>`,
    );
    await el.updateComplete;
    expect(root(el).querySelector('.reading')!.textContent!.trim()).toBe('3 min read');
    el.readingTime = 8;
    await el.updateComplete;
    expect(root(el).querySelector('.reading')!.textContent!.trim()).toBe('8 min read');
  });

  it('links back to every post, and shows its tags', async () => {
    const el = await fixture<KtBlogPost>(
      '<kt-blog-post heading="x" back-href="/blog"></kt-blog-post>',
    );
    el.tags = ['Finance', 'Guides'];
    await el.updateComplete;
    const back = root(el).querySelector<HTMLAnchorElement>('a.back')!;
    expect(back.getAttribute('href')).toBe('/blog');
    expect(back.textContent!.trim()).toBe('All posts');
    expect([...root(el).querySelectorAll('.tag')].map((tag) => tag.textContent!.trim())).toEqual([
      'Finance',
      'Guides',
    ]);
  });

  it('has no back link without back-href', async () => {
    const el = await fixture<KtBlogPost>('<kt-blog-post heading="x"></kt-blog-post>');
    expect(root(el).querySelector('a.back')).toBeNull();
  });

  it('has slots for a cover, the body and what comes after', async () => {
    const el = await fixture<KtBlogPost>('<kt-blog-post heading="x"></kt-blog-post>');
    const names = [...root(el).querySelectorAll('slot')].map((slot) => slot.name);
    expect(names).toEqual(expect.arrayContaining(['cover', '', 'end']));
  });

  it('takes its words in texts', async () => {
    const el = await fixture<KtBlogPost>(
      '<kt-blog-post heading="x" back-href="/blog" reading-time="4"></kt-blog-post>',
    );
    el.texts = { back: 'Tous les articles', minRead: (minutes) => `${minutes} min de lecture` };
    await el.updateComplete;
    expect(root(el).querySelector('a.back')!.textContent!.trim()).toBe('Tous les articles');
    expect(root(el).querySelector('.reading')!.textContent!.trim()).toBe('4 min de lecture');
  });
});
