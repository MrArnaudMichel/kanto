/**
 * Where the marker on the contents rail sits.
 *
 * Neither of the obvious answers works. Snapping to the active entry jumps
 * from row to row. A percentage of the page moves smoothly but lies: one long
 * section — a release's notes — holds the marker by the third entry while the
 * fifth is the one lit up.
 *
 * So the rail is mapped piece by piece. While the page scrolls from one
 * section's arrival to the next, the marker slides from that section's entry
 * to the next one at a steady rate. It never jumps, and it lands on an entry
 * exactly as that entry lights up. Before the first section it rests on the
 * first entry, and after the last on the last — there is nowhere further for
 * it to go.
 *
 * `stops` are the scroll offsets at which sections arrive (see
 * `readingStops`); `centres` the matching entries' centres on the rail, in px.
 */
export function railPosition(
  scroll: number,
  stops: readonly number[],
  centres: readonly number[],
): number {
  if (centres.length === 0) return 0;
  if (scroll <= stops[0]!) return centres[0]!;

  for (let index = 0; index < centres.length - 1; index += 1) {
    const from = stops[index]!;
    const to = stops[index + 1]!;
    if (scroll >= to) continue;

    const progress = (scroll - from) / (to - from);
    return centres[index]! + progress * (centres[index + 1]! - centres[index]!);
  }

  return centres[centres.length - 1]!;
}

/**
 * The scroll offset at which each section counts as arrived.
 *
 * A section arrives when its heading reaches the reading line — except that
 * the last few on a short page never can, because the page runs out of scroll
 * first. Left alone they would all arrive together on the final pixel: the
 * fill would leap to the bottom and the last entry would never light up, the
 * way most documentation sites' contents never highlight their last section.
 * Those sections are spread evenly over whatever scroll is left instead.
 */
export function readingStops(sections: readonly number[], end: number): number[] {
  const reachable = sections.filter((offset) => offset <= end).length;
  const base = reachable > 0 ? Math.max(sections[reachable - 1]!, 0) : 0;
  const unreachable = sections.length - reachable;

  let previous = 0;
  return sections.map((offset, index) => {
    const stop =
      index < reachable ? offset : base + ((end - base) * (index - reachable + 1)) / unreachable;
    previous = Math.max(stop, previous);
    return previous;
  });
}

/** The index of the last section to have arrived by `scroll`, or -1 for none yet. */
export function activeSection(scroll: number, stops: readonly number[]): number {
  let active = -1;
  stops.forEach((stop, index) => {
    if (stop <= scroll) active = index;
  });
  return active;
}
