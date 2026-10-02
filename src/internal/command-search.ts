/**
 * The search behind `<kt-command-palette>`: which commands a query keeps, and
 * in what order.
 *
 * Every word typed must appear — in the label, a keyword or the group — in
 * any order, ignoring case and accents. What matches ranks by how it matches:
 * a label that starts with the query, then a label word that does, then a
 * match inside the label, then a keyword or the group. Ties keep the order
 * given, which is the order the application chose.
 */

export interface KtCommand {
  readonly id: string;
  readonly label: string;
  /** Heading the command is listed under. */
  readonly group?: string;
  /** A Lucide icon name. */
  readonly icon?: string;
  /** Other words it answers to: "client" for New customer. */
  readonly keywords?: readonly string[];
  /** Keys shown beside it, as `<kt-kbd keys>` takes them: "mod n". */
  readonly shortcut?: string;
  readonly disabled?: boolean;
}

/** Lowercase, without accents: "Préférences" reads "preferences". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** How well `command` matches `words`; Infinity when it does not. */
function score(command: KtCommand, query: string, words: readonly string[]): number {
  const label = fold(command.label);
  const extra = fold([...(command.keywords ?? []), command.group ?? ''].join(' '));
  const all = `${label} ${extra}`;
  if (!words.every((word) => all.includes(word))) return Infinity;

  if (label.startsWith(query)) return 0;
  const labelWords = label.split(/[^\p{L}\p{N}]+/u);
  if (words.every((word) => labelWords.some((part) => part.startsWith(word)))) return 1;
  if (words.every((word) => label.includes(word))) return 2;
  return 3;
}

/** The commands `query` keeps, best first. An empty query keeps them all, in order. */
export function rankCommands(commands: readonly KtCommand[], query: string): KtCommand[] {
  const folded = fold(query.trim());
  if (!folded) return [...commands];
  const words = folded.split(/\s+/);
  return commands
    .map((command, index) => ({ command, index, rank: score(command, folded, words) }))
    .filter((entry) => entry.rank !== Infinity)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.command);
}
