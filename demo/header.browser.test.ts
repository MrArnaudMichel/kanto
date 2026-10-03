/**
 * The site header on a phone: the wordmark on one line, nothing over the
 * buttons beside it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import 'kanto-ds/styles.css';
import 'kanto-ds';
import './shell.css';

afterEach(() => document.body.replaceChildren());

describe('the site header, on a phone', () => {
  it('keeps the wordmark on one line and clear of the actions', async () => {
    await page.viewport(390, 800);
    document.body.innerHTML = `<kt-header label="Kanto documentation">
      <a slot="brand" class="wordmark" href="#/">KANTO <span>DS</span></a>
      <kt-badge slot="brand" class="version-chip" variant="code">v1.8.0</kt-badge>
      <nav class="top-nav"><a href="#/guide">Guide</a></nav>
      <div slot="actions" class="header-actions">
        <!-- As on a phone: three icon buttons, 32px each. -->
        ${'<button style="width: 32px; height: 32px"></button>'.repeat(3)}
      </div>
    </kt-header>`;
    const header = document.querySelector('kt-header')!;
    await (header as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const wordmark = document.querySelector('.wordmark')!;
    const range = document.createRange();
    range.selectNodeContents(wordmark);
    const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
    expect(lines.size).toBe(1);

    const actions = document.querySelector('.header-actions')!.getBoundingClientRect();
    for (const brand of document.querySelectorAll('[slot="brand"]')) {
      const box = brand.getBoundingClientRect();
      if (box.width === 0) continue;
      expect(box.right, brand.className).toBeLessThanOrEqual(actions.left + 0.5);
    }
  });
});
