import { render } from 'lit';
import { describe, expect, it } from 'vitest';
import { code, highlight } from './highlight.js';

describe('highlight', () => {
  it('colours a language it knows, under the names the docs use', () => {
    expect(highlight("import 'kanto-ds';", 'js')).toContain(
      '<span class="hljs-keyword">import</span>',
    );
    expect(highlight('<kt-button variant="primary">', 'html')).toContain('hljs-attr');
    expect(highlight('const x: number = 1;', 'tsx')).toContain('hljs-keyword');
    expect(highlight('npm install kanto-ds # once', 'sh')).toContain('hljs-comment');
  });

  it('escapes what it cannot colour', () => {
    expect(highlight('<b>&</b>', 'brainfuck')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
  });
});

describe('code', () => {
  it('renders a kt-code holding the coloured markup, with its copy button', () => {
    const host = document.createElement('div');
    render(code('<kt-button>Save</kt-button>', 'html'), host);
    const block = host.querySelector('kt-code')!;
    expect(block.getAttribute('language')).toBe('html');
    expect(block.hasAttribute('copy')).toBe(true);
    expect(block.querySelector('.hljs-tag')).not.toBeNull();
    // What the copy button copies is the code, not the markup.
    expect(block.textContent).toBe('<kt-button>Save</kt-button>');
  });
});
