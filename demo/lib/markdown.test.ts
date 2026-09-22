import { describe, expect, it } from 'vitest';
import { plainTextOf, renderDoc, renderUntrustedMarkdown } from './markdown.js';

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

describe('renderUntrustedMarkdown', () => {
  it('renders the markdown', () => {
    const out = renderUntrustedMarkdown('## Added\n\n- `kt-meter`\n- **kt-page-header**\n');
    expect(out).toContain('<h2');
    expect(out).toContain('<li>');
    expect(out).toContain('<strong>kt-page-header</strong>');
  });

  it('drops embedded HTML, block and inline', () => {
    // Release notes arrive over the network. marked passes raw HTML straight
    // through, so anything in a note would land in the page with the same
    // privileges as the docs themselves.
    const out = renderUntrustedMarkdown(
      'Before\n\n<img src=x onerror="alert(1)">\n\nAfter with <b>inline</b> too.\n',
    );
    expect(out).not.toContain('<img');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<b>');
    expect(out).toContain('Before');
    expect(out).toContain('After with');
  });

  it('escapes what it puts in a code block', () => {
    const out = renderUntrustedMarkdown('```\n<script>alert(1)</script>\n```\n');
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });
});

describe('renderUntrustedMarkdown under a heading of the page', () => {
  it('moves the shallowest heading to the level it is given, keeping the rest in step', () => {
    const out = renderUntrustedMarkdown('## Added\n\n#### Detail\n\n- x', { headingBase: 4 });

    expect(out).toContain('<h4');
    expect(out).toContain('<h6');
    expect(out).not.toContain('<h2');
  });

  it('treats a changelog section and a GitHub release body alike', () => {
    // The changelog nests its sections at ###, a release body usually at ##.
    // Under the same page heading they must come out at the same level.
    const fromChangelog = renderUntrustedMarkdown('### Fixed\n\n- y', { headingBase: 4 });
    const fromGitHub = renderUntrustedMarkdown('## Fixed\n\n- y', { headingBase: 4 });

    expect(fromChangelog).toBe(fromGitHub);
  });

  it('never goes deeper than h6', () => {
    const out = renderUntrustedMarkdown('# A\n\n### B', { headingBase: 5 });

    expect(out).toContain('<h5');
    expect(out).toContain('<h6');
    expect(out).not.toContain('<h7');
  });

  it('ignores a hash inside a code block when working out the levels', () => {
    const out = renderUntrustedMarkdown('```sh\n# a comment\n```\n\n## Added', { headingBase: 4 });

    expect(out).toContain('<h4');
  });
});
