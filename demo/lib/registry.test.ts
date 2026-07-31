import { describe, expect, it } from 'vitest';
import { render } from 'lit';
import { COMPONENTS } from './registry.js';
import { renderDoc } from './markdown.js';

/**
 * A smoke test for the documentation site.
 *
 * The site is generated from the components' own markdown and a registry of
 * live examples, so it can break in ways nothing else notices: a renamed doc
 * file, a component whose example stops compiling, a heading that collides
 * with another and steals its anchor. This catches all three.
 */
describe('the component registry', () => {
  it('covers every element that has a documentation page', () => {
    // 28 elements ship; kt-toggle-button-group and kt-toast-container each
    // have their own page too.
    expect(COMPONENTS.length).toBeGreaterThanOrEqual(28);
    expect(new Set(COMPONENTS.map((c) => c.slug)).size).toBe(COMPONENTS.length);
  });

  it('groups every component under a known heading', () => {
    const groups = new Set(COMPONENTS.map((c) => c.group));
    expect([...groups].sort()).toEqual([
      'Core',
      'Data',
      'Feedback',
      'Forms',
      'Navigation',
      'Overlays',
    ]);
  });

  it('gives every component a live example, not the fallback', () => {
    const withoutExample = COMPONENTS.filter((entry) => {
      const container = document.createElement('div');
      render(entry.example(), container);
      return container.textContent?.includes('No live preview');
    });

    expect(withoutExample.map((c) => c.slug)).toEqual([]);
  });

  it('renders every example without throwing', () => {
    for (const entry of COMPONENTS) {
      const container = document.createElement('div');
      document.body.append(container);
      expect(() => render(entry.example(), container), entry.slug).not.toThrow();
      container.remove();
    }
  });
});

describe('the rendered documentation', () => {
  it('pulls a title and a summary out of every page', () => {
    for (const entry of COMPONENTS) {
      const doc = renderDoc(entry.doc);
      expect(doc.title, entry.slug).toBeTruthy();
      expect(doc.summary.length, entry.slug).toBeGreaterThan(10);
    }
  });

  it('gives every page a table of contents', () => {
    for (const entry of COMPONENTS) {
      const doc = renderDoc(entry.doc);
      expect(doc.headings.length, entry.slug).toBeGreaterThan(0);
    }
  });

  it('never repeats a heading id within a page', () => {
    for (const entry of COMPONENTS) {
      const ids = renderDoc(entry.doc).headings.map((h) => h.id);
      expect(new Set(ids).size, entry.slug).toBe(ids.length);
    }
  });

  it('renders a fenced block as <kt-code>, labelled and copyable', () => {
    const doc = renderDoc('# Thing\n\nSummary line here.\n\n```js\nconst a = 1;\n```\n');
    expect(doc.html).toContain('<kt-code language="javascript" copy>');
    // The chrome is the element's; only the highlighted markup is ours.
    expect(doc.html).toContain('hljs-keyword');
    expect(doc.html).not.toContain('code-block');
  });

  it('labels an unfenced language as text rather than leaving it blank', () => {
    const doc = renderDoc('# Thing\n\nSummary line here.\n\n```\nplain\n```\n');
    expect(doc.html).toContain('language="text"');
  });

  it('wraps tables so a wide one scrolls on its own', () => {
    const doc = renderDoc('# Thing\n\nSummary line here.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n');
    expect(doc.html).toContain('class="table-wrap"');
  });

  it('disambiguates two headings with the same text', () => {
    const doc = renderDoc('# Thing\n\nSummary.\n\n## Usage\n\n## Usage\n');
    expect(doc.headings.map((h) => h.id)).toEqual(['usage', 'usage-1']);
  });
});
