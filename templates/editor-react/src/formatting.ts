/**
 * What the toolbar does to the text: wrap the selection in Markdown, or mark
 * the lines it touches, and say what to select afterwards.
 */
export type Format = 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'list' | 'quote';

export interface Edit {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

const WRAPS: Record<'bold' | 'italic' | 'code', { mark: string; placeholder: string }> = {
  bold: { mark: '**', placeholder: 'bold text' },
  italic: { mark: '*', placeholder: 'italic text' },
  code: { mark: '`', placeholder: 'code' },
};

const PREFIXES: Record<'heading' | 'list' | 'quote', string> = {
  heading: '## ',
  list: '- ',
  quote: '> ',
};

export function applyFormat(text: string, start: number, end: number, format: Format): Edit {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const selected = text.slice(start, end);

  if (format === 'link') {
    const label = selected || 'link text';
    const url = 'https://';
    const inserted = `[${label}](${url})`;
    // The address is what is left to type: select it.
    const at = start + label.length + 3;
    return { text: before + inserted + after, start: at, end: at + url.length };
  }

  if (format === 'heading' || format === 'list' || format === 'quote') {
    const prefix = PREFIXES[format];
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = text.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const lines = text.slice(lineStart, lineEnd).split('\n');
    const marked = lines.map((line) => prefix + line).join('\n');
    return {
      text: text.slice(0, lineStart) + marked + text.slice(lineEnd),
      start: start + prefix.length,
      end: end + prefix.length * lines.length,
    };
  }

  const { mark, placeholder } = WRAPS[format];
  const inner = selected || placeholder;
  const at = start + mark.length;
  return { text: before + mark + inner + mark + after, start: at, end: at + inner.length };
}
