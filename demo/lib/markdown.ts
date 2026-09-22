import { Marked, type Tokens } from 'marked';
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

/** Language aliases used in the component docs. */
const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'xml',
  vue: 'xml',
  svelte: 'xml',
  sh: 'bash',
};

export interface Heading {
  readonly id: string;
  readonly text: string;
  readonly level: number;
}

export interface RenderedDoc {
  /** The `# …` title, stripped of backticks. */
  readonly title: string;
  /** The first paragraph, as plain text. */
  readonly summary: string;
  /** Everything after the title, as HTML. */
  readonly html: string;
  /** The `##`/`###` headings, for the table of contents. */
  readonly headings: readonly Heading[];
}

/** `<kt-button>` → `kt-button`, `Against \`kt-tabs\`` → `against-kt-tabs`. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Renders one component's markdown.
 *
 * The docs live beside their component and are the single source: this page
 * cannot drift from them, because it *is* them.
 */
export function renderDoc(source: string): RenderedDoc {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ depth, tokens }: Tokens.Heading) {
        const plain = plainTextOf(this.parser.parseInline(tokens));
        let id = slugify(plain);

        // Two sections called "Usage" would otherwise fight over the anchor.
        const count = seen.get(id) ?? 0;
        seen.set(id, count + 1);
        if (count > 0) id = `${id}-${count}`;

        if (depth > 1 && depth < 4) headings.push({ id, text: plain, level: depth });
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
      },
      code({ text, lang }: Tokens.Code) {
        const language = ALIASES[lang ?? ''] ?? lang ?? '';
        const highlighted = hljs.getLanguage(language)
          ? hljs.highlight(text, { language }).value
          : escapeHtml(text);

        // The chrome is <kt-code>'s job; this only supplies the highlighted
        // markup it slots.
        return `<kt-code language="${language || 'text'}" copy>${highlighted}</kt-code>`;
      },
      table(token: Tokens.Table) {
        // Wrapped so a wide API table scrolls on its own instead of pushing
        // the page sideways.
        const head = token.header
          .map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`)
          .join('');
        const body = token.rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`,
          )
          .join('');
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      },
    },
  });

  const titleMatch = /^#\s+(.+)$/m.exec(source);
  const title = (titleMatch?.[1] ?? '').replace(/[`<>]/g, '').trim();

  const body = titleMatch ? source.slice(titleMatch.index + titleMatch[0].length) : source;
  const summaryMatch = /^\s*\n([^\n#|].*(?:\n[^\n#|].*)*)/.exec(body);
  const summary = (summaryMatch?.[1] ?? '')
    .replace(/\n/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*]/g, '')
    .trim();

  const html = marked.parse(body, { async: false });
  return { title, summary, html, headings };
}

/**
 * Renders markdown that did not come from this repository.
 *
 * Release notes arrive over the network, and marked passes raw HTML straight
 * through — so anything embedded in a note would be inserted into the page with
 * the same privileges as the docs themselves. Dropping the `html` tokens is the
 * precise fix: every other construct still renders, and there is no HTML left
 * to insert. Headings get no anchors either, since these are not page sections.
 *
 * `headingBase` places the notes under a heading of the page: the shallowest
 * heading in the source becomes that level and the rest keep their distance
 * from it. The changelog nests its sections at `###` and a GitHub release body
 * usually at `##`, and without this the same "Fixed" would render at two
 * different sizes depending on which source answered.
 */
export function renderUntrustedMarkdown(
  source: string,
  { headingBase }: { headingBase?: number } = {},
): string {
  // From the lexer rather than a regex over lines, so a `#` comment inside a
  // fenced block is not mistaken for a heading.
  const depths = new Marked()
    .lexer(source)
    .flatMap((token) => (token.type === 'heading' ? [(token as Tokens.Heading).depth] : []));
  const shift = headingBase && depths.length > 0 ? headingBase - Math.min(...depths) : 0;

  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      html: () => '',
      heading({ depth, tokens }: Tokens.Heading) {
        const level = Math.min(Math.max(depth + shift, 1), 6);
        return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>`;
      },
      code({ text }: Tokens.Code) {
        return `<kt-code>${escapeHtml(text)}</kt-code>`;
      },
    },
  });

  return marked.parse(source, { async: false });
}

/**
 * The reader's text for a heading: markup out, entities back to characters.
 *
 * Stripping the tags is not enough. A heading like `<form>` renders as
 * `<code>&lt;form&gt;</code>`, and dropping the tags leaves the entities
 * behind — which the table of contents then prints literally, because it
 * sets this as text rather than as HTML. Decode &amp; last, or `&amp;lt;`
 * turns into a real `<` on the way through.
 */
export function plainTextOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
