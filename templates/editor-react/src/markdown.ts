/**
 * Markdown to DOM nodes, for the preview: headings, paragraphs, lists, quotes,
 * fenced code, bold, italic, code and links. Text always goes in as text — raw
 * HTML shows as written — and a link keeps its href only for http(s), mailto
 * and in-page anchors. No framework is needed to build nodes, so every stack
 * mounts these.
 */

const SAFE_HREF = /^(https?:\/\/|mailto:|#)/i;

function element(tag: string, children: (Node | string)[] = []): HTMLElement {
  const node = document.createElement(tag);
  node.append(...children);
  return node;
}

/** `code`, **bold**, *italic*, [text](href) — the rest as text. */
const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string): (Node | string)[] {
  const out: (Node | string)[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const [, code, bold, italic, label, href] = match;
    if (code !== undefined) out.push(element('code', [code]));
    else if (bold !== undefined) out.push(element('strong', [bold]));
    else if (italic !== undefined) out.push(element('em', [italic]));
    else if (SAFE_HREF.test(href!)) {
      const link = element('a', [label!]);
      link.setAttribute('href', href!);
      if (/^https?:/i.test(href!)) link.setAttribute('rel', 'noopener noreferrer');
      out.push(link);
    } else out.push(label!);
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const UNORDERED = /^\s*[-*]\s+/;
const ORDERED = /^\s*\d+\.\s+/;

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
    } else if (/^#{1,3}\s/.test(line)) {
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
      blocks.push(
        element(
          pattern === UNORDERED ? 'ul' : 'ol',
          items.map((item) => element('li', inline(item.replace(pattern, '').trim()))),
        ),
      );
    } else {
      const paragraph = take(
        (candidate) =>
          candidate.trim() !== '' &&
          !candidate.trim().startsWith('```') &&
          !/^#{1,3}\s/.test(candidate) &&
          !candidate.trimStart().startsWith('>') &&
          !UNORDERED.test(candidate) &&
          !ORDERED.test(candidate),
      );
      blocks.push(element('p', inline(paragraph.map((part) => part.trim()).join(' '))));
    }
  }
  return blocks;
}
