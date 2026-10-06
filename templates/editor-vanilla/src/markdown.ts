/**
 * Markdown to DOM nodes, for the preview: headings, paragraphs, lists, quotes,
 * rules, fenced code, bold, italic, code and links. Text always goes in as text — raw
 * HTML shows as written — and a link keeps its href only for http(s), mailto
 * and other documents (`#/doc/<id>`). No framework is needed to build nodes,
 * so every stack mounts these.
 */

// `#/doc/…` opens another document; a bare anchor would leave this one.
const SAFE_HREF = /^(https?:\/\/|mailto:|#\/doc\/)/i;

function element(tag: string, children: (Node | string)[] = []): HTMLElement {
  const node = document.createElement(tag);
  node.append(...children);
  return node;
}

/** A link's address, `(` to its `)`, parentheses inside it balanced: `wiki/Foo_(bar)`. */
function address(text: string, open: number): { href: string; end: number } | null {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const char = text[i]!;
    if (/\s/.test(char)) return null;
    if (char === '(') depth += 1;
    else if (char === ')' && (depth -= 1) === 0)
      return { href: text.slice(open + 1, i), end: i + 1 };
  }
  return null;
}

/** Where `**` closes: the pair not followed by another `*`, so `***` ends bold after italic. */
function closingBold(text: string, from: number): number {
  for (let j = text.indexOf('**', from); j !== -1; j = text.indexOf('**', j + 1)) {
    if (text[j + 2] !== '*') return j;
  }
  return -1;
}

/** `code`, **bold**, *italic* and [text](href), marks inside marks — the rest as text. */
function inline(text: string): (Node | string)[] {
  const out: (Node | string)[] = [];
  let plain = '';
  const flush = () => {
    if (plain) out.push(plain);
    plain = '';
  };
  let i = 0;
  while (i < text.length) {
    const char = text[i]!;
    if (char === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        out.push(element('code', [text.slice(i + 1, end)]));
        i = end + 1;
        continue;
      }
    } else if (char === '*' && text[i + 1] === '*') {
      const end = closingBold(text, i + 2);
      if (end > i + 2) {
        flush();
        out.push(element('strong', inline(text.slice(i + 2, end))));
        i = end + 2;
        continue;
      }
    } else if (char === '*' && text[i + 1] !== undefined && !/\s/.test(text[i + 1]!)) {
      let end = text.indexOf('*', i + 1);
      // Past a bold pair inside: `*italic **and bold***`.
      while (end !== -1 && text[end + 1] === '*' && end + 2 < text.length)
        end = text.indexOf('*', end + 2);
      if (end > i + 1) {
        flush();
        out.push(element('em', inline(text.slice(i + 1, end))));
        i = end + 1;
        continue;
      }
    } else if (char === '[') {
      const close = text.indexOf('](', i + 1);
      const target = close === -1 ? null : address(text, close + 1);
      if (target) {
        flush();
        const label = inline(text.slice(i + 1, close));
        if (SAFE_HREF.test(target.href)) {
          const link = element('a', label);
          link.setAttribute('href', target.href);
          if (/^https?:/i.test(target.href)) link.setAttribute('rel', 'noopener noreferrer');
          out.push(link);
        } else out.push(...label);
        i = target.end;
        continue;
      }
    }
    plain += char;
    i += 1;
  }
  flush();
  return out;
}

const UNORDERED = /^\s*[-*]\s+/;
const ORDERED = /^\s*\d+\.\s+/;
const HEADING = /^#{1,6}\s/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

export function renderMarkdown(source: string): Node[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Node[] = [];
  let i = 0;
  const take = (test: (line: string) => boolean): string[] => {
    const taken: string[] = [];
    while (i < lines.length && test(lines[i]!)) taken.push(lines[(i += 1) - 1]!);
    return taken;
  };

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === '') {
      i += 1;
    } else if (line.trim().startsWith('```')) {
      i += 1;
      const code = take((candidate) => !candidate.trim().startsWith('```'));
      i += 1; // the closing fence, if there is one
      blocks.push(element('pre', [element('code', [code.join('\n')])]));
    } else if (RULE.test(line)) {
      blocks.push(element('hr'));
      i += 1;
    } else if (HEADING.test(line)) {
      const level = /^#+/.exec(line)![0].length;
      blocks.push(element(`h${level}`, inline(line.replace(/^#+\s+/, '').trim())));
      i += 1;
    } else if (line.trimStart().startsWith('>')) {
      const quoted = take((candidate) => candidate.trimStart().startsWith('>'));
      const text = quoted.map((candidate) => candidate.trimStart().replace(/^>\s?/, '')).join(' ');
      blocks.push(element('blockquote', [element('p', inline(text.trim()))]));
    } else if (UNORDERED.test(line) || ORDERED.test(line)) {
      const pattern = UNORDERED.test(line) ? UNORDERED : ORDERED;
      const items = take((candidate) => pattern.test(candidate));
      const list = element(
        pattern === UNORDERED ? 'ul' : 'ol',
        items.map((item) => element('li', inline(item.replace(pattern, '').trim()))),
      );
      // A numbered list goes on from where it was left: `2.` after a blank line is 2.
      const first = Number.parseInt(line, 10);
      if (pattern === ORDERED && first !== 1) list.setAttribute('start', String(first));
      blocks.push(list);
    } else {
      const paragraph = take(
        (candidate) =>
          candidate.trim() !== '' &&
          !candidate.trim().startsWith('```') &&
          !HEADING.test(candidate) &&
          !RULE.test(candidate) &&
          !candidate.trimStart().startsWith('>') &&
          !UNORDERED.test(candidate) &&
          !ORDERED.test(candidate),
      );
      blocks.push(element('p', inline(paragraph.map((part) => part.trim()).join(' '))));
    }
  }
  return blocks;
}
