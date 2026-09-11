/**
 * The icon registry.
 *
 * `<kt-icon>` looks icons up by name at render time, which means the set of
 * icons cannot be statically analysed and a bundler cannot tree-shake it. So
 * Kanto does not bundle all two thousand Lucide icons: the elements register
 * the handful they need themselves, and an application registers whatever else
 * it uses.
 *
 *     import { Rocket, Wallet } from 'lucide';
 *     import { registerIcons } from 'kanto/icons';
 *
 *     registerIcons({ Rocket, Wallet });
 *
 * Names are normalised to kebab-case, so `Rocket`, `rocket` and
 * `ChevronDown` / `chevron-down` all resolve.
 */

/** A Lucide icon: a flat list of SVG children, each `[tag, attributes]`. */
export type IconNode = [tag: string, attrs: Record<string, string | number | undefined>][];

const registry = new Map<string, IconNode>();

/**
 * `ChevronDown` → `chevron-down`, `Trash2` → `trash-2`, `AArrowDown` →
 * `a-arrow-down`.
 *
 * The digit boundary matters: Lucide names that icon `trash-2`, so a rule that
 * only splits on case produces `trash2` and the lookup quietly misses.
 */
export function toKebabCase(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // acronym run before a word
    .replace(/([a-zA-Z])(\d)/g, '$1-$2') // letter before a digit
    .replace(/([a-z])([A-Z])/g, '$1-$2') // ordinary camel boundary
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Registers a single icon under `name`. */
export function registerIcon(name: string, node: IconNode): void {
  registry.set(toKebabCase(name), node);
}

/**
 * Registers a map of icons. Accepts a Lucide namespace import directly:
 * every non-icon export (`createElement`, `createIcons`, …) is skipped.
 */
export function registerIcons(icons: Record<string, unknown>): void {
  for (const [name, node] of Object.entries(icons)) {
    if (isIconNode(node)) registerIcon(name, node);
  }
}

/** Returns the icon registered under `name`, or `undefined`. */
export function getIcon(name: string): IconNode | undefined {
  return registry.get(toKebabCase(name));
}

/** Every registered name, kebab-cased and sorted. Useful for docs and tests. */
export function registeredIcons(): string[] {
  return [...registry.keys()].sort();
}

function isIconNode(value: unknown): value is IconNode {
  return (
    Array.isArray(value) &&
    value.every(
      (child) =>
        Array.isArray(child) &&
        typeof child[0] === 'string' &&
        typeof child[1] === 'object' &&
        child[1] !== null,
    )
  );
}
