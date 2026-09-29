/**
 * The contents rail: which part of the page is on screen, drawn against the
 * entries that stand for it.
 *
 * Each section runs from its heading to the next one, the last to the end of
 * the page; `sections` are those headings' offsets in the document, and `end`
 * the page's height. Each section owns one entry on the rail. A position in
 * the document maps to the rail through its section: a third of the way down
 * a section is a third of the way down its entry. One long section — a
 * release's notes — then moves the marker slowly through its entry instead of
 * holding it on one row while the reader scrolls a whole screen.
 */

export interface RailEntry {
  /** From the top of the rail, in px. */
  readonly top: number;
  readonly height: number;
}

/** Where the document offset `y` lands on the rail, in px. */
export function railOffset(
  y: number,
  sections: readonly number[],
  end: number,
  entries: readonly RailEntry[],
): number {
  if (entries.length === 0) return 0;
  if (y <= sections[0]!) return entries[0]!.top;

  for (let index = 0; index < entries.length; index += 1) {
    const start = sections[index]!;
    const stop = sections[index + 1] ?? end;
    if (y >= stop) continue;

    const entry = entries[index]!;
    return entry.top + ((y - start) / (stop - start)) * entry.height;
  }

  const last = entries[entries.length - 1]!;
  return last.top + last.height;
}

/**
 * The stretch of rail standing for the screen, from `from` to `to` in the
 * document: as many entries as there are sections in view, parts included.
 */
export function visibleSpan(
  from: number,
  to: number,
  sections: readonly number[],
  end: number,
  entries: readonly RailEntry[],
): { top: number; size: number } {
  const top = railOffset(from, sections, end, entries);
  return { top, size: railOffset(to, sections, end, entries) - top };
}

/** The sections with some of their length between `from` and `to`. */
export function visibleSections(
  from: number,
  to: number,
  sections: readonly number[],
  end: number,
): number[] {
  return sections.flatMap((start, index) => {
    const stop = sections[index + 1] ?? end;
    return start < to && stop > from ? [index] : [];
  });
}
