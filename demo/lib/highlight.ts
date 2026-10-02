/**
 * Syntax colouring for every code block on the site, from one highlighter:
 * the markdown pages, the home page, the playground's snippet, the examples.
 * The palette is in shell.css, built from Kanto's text tokens so it holds its
 * contrast in both themes.
 */
import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';

for (const [name, language] of [
  ['javascript', javascript],
  ['typescript', typescript],
  ['xml', xml],
  ['css', css],
  ['bash', bash],
  ['json', json],
] as const) {
  hljs.registerLanguage(name, language);
}

/** The names code blocks use, mapped to the grammar that reads them. */
const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'xml',
  vue: 'xml',
  svelte: 'xml',
  sh: 'bash',
  shell: 'bash',
};

/** The grammar a block's language names, or '' for none. */
export function grammarOf(language: string): string {
  const name = ALIASES[language] ?? language;
  return hljs.getLanguage(name) ? name : '';
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** `source` as highlighted HTML, or escaped text in a language it does not know. */
export function highlight(source: string, language: string): string {
  const grammar = grammarOf(language);
  return grammar ? hljs.highlight(source, { language: grammar }).value : escapeHtml(source);
}

/** A <kt-code> block, coloured, with its copy button. */
export function code(source: string, language: string, { copy = true } = {}): TemplateResult {
  return html`<kt-code language=${language} ?copy=${copy}
    >${unsafeHTML(highlight(source, language))}</kt-code
  >`;
}
