/** The body in a measure, centred; the reading time follows the body. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-blog-post.js';
import type { KtBlogPost } from 'kanto-ds';

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('kt-blog-post, laid out', () => {
  it('keeps the body to a readable measure, centred', async () => {
    const el = await fixture<KtBlogPost>(
      `<kt-blog-post heading="x" style="width: 1200px"><p>${words(400)}</p></kt-blog-post>`,
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const host = el.getBoundingClientRect();
    const body = el.shadowRoot!.querySelector('.prose')!.getBoundingClientRect();
    expect(body.width).toBeLessThan(800);
    expect(Math.abs(body.left - host.left - (host.right - body.right))).toBeLessThan(2);
  });

  it('counts the reading time again when the body changes', async () => {
    const el = await fixture<KtBlogPost>(
      `<kt-blog-post heading="x"><p>${words(230)}</p></kt-blog-post>`,
    );
    await el.updateComplete;
    const reading = () => el.shadowRoot!.querySelector('.reading')!.textContent!.trim();
    expect(reading()).toBe('1 min read');
    const more = document.createElement('p');
    more.textContent = words(1150);
    el.append(more);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    expect(reading()).toBe('6 min read');
  });
});
