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

/**
 * The part of `before` that `after` replaced: the least that changed. Applied
 * as an edit of that range — not by setting the whole value — the browser
 * keeps it on its undo stack, so Ctrl+Z takes it back.
 */
export function replacedRange(
  before: string,
  after: string,
): { start: number; end: number; text: string } {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start])
    start += 1;
  let tail = 0;
  while (
    tail < before.length - start &&
    tail < after.length - start &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  )
    tail += 1;
  return { start, end: before.length - tail, text: after.slice(start, after.length - tail) };
}

/**
 * Formats the selection of `field` as the browser's own edit, so Ctrl+Z takes
 * it back, and selects what the format left to type. The field's `input`
 * event fires as for typing: whatever listens to it sees the new text.
 */
export function formatField(field: HTMLTextAreaElement, format: Format): Edit {
  const before = field.value;
  const edit = applyFormat(before, field.selectionStart, field.selectionEnd, format);
  const range = replacedRange(before, edit.text);
  field.focus();
  field.setSelectionRange(range.start, range.end);
  // execCommand is the one edit browsers put on the undo stack; where it is
  // missing or refused, the text still changes — without the undo.
  const done =
    typeof document.execCommand === 'function' &&
    document.execCommand('insertText', false, range.text);
  if (!done || field.value !== edit.text) {
    field.setRangeText(range.text, range.start, range.end);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  field.setSelectionRange(edit.start, edit.end);
  return edit;
}
