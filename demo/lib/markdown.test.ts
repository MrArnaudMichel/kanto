import { describe, expect, it } from 'vitest';
import { plainTextOf, renderDoc } from './markdown.js';

describe('plainTextOf', () => {
  it('drops markup and puts the characters back', () => {
    expect(plainTextOf('A <code>&lt;form&gt;</code> of its own')).toBe('A <form> of its own');
    expect(plainTextOf('&quot;quoted&quot; and &#39;quoted&#39;')).toBe('"quoted" and \'quoted\'');
  });

  it('decodes &amp; last, so an escaped entity survives as text', () => {
    // &amp;lt; means the author wrote "&lt;" and wants to see it, not "<".
    expect(plainTextOf('&amp;lt;')).toBe('&lt;');
    expect(plainTextOf('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });
});

describe('renderDoc', () => {
  it('gives the table of contents readable heading text', () => {
    // The bug this replaced printed "Against &lt;kt-confirm-dialog&gt;" in the
    // sidebar, because the entities outlived the tag strip.
    const doc = renderDoc('# Title\n\n## Against `<kt-confirm-dialog>`\n\nBody.\n');
    expect(doc.headings.map((h) => h.text)).toEqual(['Against <kt-confirm-dialog>']);
  });

  it('still escapes the heading in the rendered HTML', () => {
    const doc = renderDoc('# Title\n\n## Inside a `<form>`\n\nBody.\n');
    expect(doc.html).toContain('&lt;form&gt;');
    expect(doc.html).not.toMatch(/<form>/);
  });

  it('keeps anchors unique when two headings share a name', () => {
    const doc = renderDoc('# T\n\n## Usage\n\na\n\n## Usage\n\nb\n');
    expect(doc.headings.map((h) => h.id)).toEqual(['usage', 'usage-1']);
  });
});
