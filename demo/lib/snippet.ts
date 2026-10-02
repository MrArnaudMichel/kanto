/**
 * An appearance as code to paste: only what differs from Kanto as it ships,
 * in a fixed order, so the snippet reads the same however it was reached.
 */
import { KT_ACCENTS, KT_DEFAULT_APPEARANCE, type KtAppearance } from 'kanto-ds';

type Appearance = Required<KtAppearance>;

/** Setting → attribute, in the order a reader expects them. */
const ORDER = [
  ['theme', 'data-theme'],
  ['accent', 'data-accent'],
  ['font', 'data-font'],
  ['radius', 'data-radius'],
  ['density', 'data-density'],
  ['textSize', 'data-text-size'],
] as const;

const changed = (appearance: Appearance) =>
  ORDER.filter(([key]) => appearance[key] !== KT_DEFAULT_APPEARANCE[key]);

const isPreset = (accent: string) => KT_ACCENTS.some((preset) => preset.id === accent);

/** The settings that attributes can hold, as ` data-…="…"` pairs. */
export function htmlAttributes(appearance: Appearance): string {
  return changed(appearance)
    .filter(([key]) => key !== 'accent' || isPreset(appearance.accent))
    .map(([key, attribute]) => ` ${attribute}="${appearance[key]}"`)
    .join('');
}

/** A colour no preset names, which only setAccent can apply; null for a preset. */
export function customAccent(appearance: Appearance): string | null {
  return isPreset(appearance.accent) ? null : appearance.accent;
}

/** The settings as attributes on <html>; a custom colour, which no attribute holds, as a note. */
export function htmlSnippet(appearance: Appearance): string {
  const attributes = htmlAttributes(appearance);
  const tag = `<html${attributes}>`;
  if (!attributes && isPreset(appearance.accent)) {
    return `${tag}\n<!-- Kanto as it ships. Pick a colour, a font or a density to see its attribute. -->`;
  }
  return isPreset(appearance.accent)
    ? tag
    : `${tag}\n<!-- and in a script: setAccent('${appearance.accent}') -->`;
}

/** The settings as a setAppearance call. */
export function jsSnippet(appearance: Appearance): string {
  const entries = changed(appearance).map(([key]) => `${key}: '${appearance[key]}'`);
  const call = entries.length
    ? `setAppearance({ ${entries.join(', ')} });`
    : 'setAppearance({}); // Kanto as it ships';
  return `import { setAppearance } from 'kanto-ds';\n\n${call}`;
}
