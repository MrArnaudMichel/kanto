/**
 * What the toolbar does to the text: wrap the selection in Markdown, or mark
 * the lines it touches, and say what to select afterwards.
 */
export type Format = 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'list' | 'quote';

/** The toolbar, in order. `keys` is the shortcut with Ctrl, or Cmd on a Mac. */
export const TOOLS: readonly { format: Format; icon: string; label: string; keys?: string }[] = [
  { format: 'heading', icon: 'heading-2', label: 'Heading' },
  { format: 'bold', icon: 'bold', label: 'Bold', keys: 'b' },
  { format: 'italic', icon: 'italic', label: 'Italic', keys: 'i' },
  { format: 'code', icon: 'code', label: 'Code' },
  { format: 'list', icon: 'list', label: 'List' },
  { format: 'quote', icon: 'text-quote', label: 'Quote' },
  { format: 'link', icon: 'link', label: 'Link', keys: 'k' },
];

type Tool = (typeof TOOLS)[number];

const onMac = (): boolean => /Mac|iPhone|iPad/.test(navigator.platform);

/** What a tool's tooltip says: its name, and its shortcut as this computer writes it. */
export const toolTip = (tool: Tool): string =>
  tool.keys ? `${tool.label} (${onMac() ? 'Cmd' : 'Ctrl'}+${tool.keys.toUpperCase()})` : tool.label;

/** The tool a key press asks for: Ctrl or Cmd with its letter, and nothing else held. */
export function toolFor(event: KeyboardEvent): Tool | undefined {
  if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return undefined;
  return TOOLS.find((tool) => tool.keys === event.key.toLowerCase());
}

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

/** Whether `mark` sits at the end of `text` as itself — a single `*` is not the end of `**`. */
const endsWithMark = (text: string, mark: string) =>
  text.endsWith(mark) && (mark !== '*' || !text.endsWith('**') || text.endsWith('***'));
const startsWithMark = (text: string, mark: string) =>
  text.startsWith(mark) && (mark !== '*' || !text.startsWith('**') || text.startsWith('***'));

/**
 * The toolbar's edit: wraps the selection, or marks the lines it touches —
 * and takes the format away when it is already there, as a toggle does.
 */
export function applyFormat(text: string, start: number, end: number, format: Format): Edit {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const selected = text.slice(start, end);

  if (format === 'link') {
    // An address selected is the link's address; the label is what is left to type.
    if (/^(https?:\/\/|mailto:)\S+$/.test(selected)) {
      const label = 'link text';
      return {
        text: `${before}[${label}](${selected})${after}`,
        start: start + 1,
        end: start + 1 + label.length,
      };
    }
    const label = selected || 'link text';
    const url = 'https://';
    const inserted = `[${label}](${url})`;
    // The address is what is left to type: select it.
    const at = start + label.length + 3;
    return { text: before + inserted + after, start: at, end: at + url.length };
  }

  if (format === 'heading' || format === 'list' || format === 'quote') {
    const prefix = PREFIXES[format];
    // A selection ending just after a line break stops on the line before it.
    const last = end > start && text[end - 1] === '\n' ? end - 1 : end;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = text.indexOf('\n', last);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const lines = text.slice(lineStart, lineEnd).split('\n');
    const head = text.slice(0, lineStart);
    const tail = text.slice(lineEnd);
    if (lines.every((line) => line.startsWith(prefix))) {
      const plain = lines.map((line) => line.slice(prefix.length)).join('\n');
      const from = Math.max(lineStart, start - prefix.length);
      return {
        text: head + plain + tail,
        start: from,
        end: Math.max(from, last - prefix.length * lines.length),
      };
    }
    const marked = lines.map((line) => prefix + line).join('\n');
    return {
      text: head + marked + tail,
      start: start + prefix.length,
      end: last + prefix.length * lines.length,
    };
  }

  const { mark, placeholder } = WRAPS[format];
  // Already marked, inside the selection or around it: unmark.
  if (
    selected.length >= mark.length * 2 &&
    startsWithMark(selected, mark) &&
    endsWithMark(selected, mark)
  ) {
    const inner = selected.slice(mark.length, -mark.length);
    return { text: before + inner + after, start, end: start + inner.length };
  }
  if (selected && endsWithMark(before, mark) && startsWithMark(after, mark)) {
    const from = start - mark.length;
    return {
      text: before.slice(0, -mark.length) + selected + after.slice(mark.length),
      start: from,
      end: from + selected.length,
    };
  }
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
