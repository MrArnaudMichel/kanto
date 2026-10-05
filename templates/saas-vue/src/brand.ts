/**
 * The brand, in one place. Change the accent, the font, the corners or the
 * density here and every screen follows. Every option:
 * https://kanto.arnaudmichel.fr/#/guide/appearance
 */
import { setAppearance } from 'kanto-ds';

export function applyBrand(): void {
  setAppearance({
    theme: 'auto',
    accent: 'violet',
    font: 'kanto',
    radius: 'default',
    density: 'default',
  });
  // A colour of your own rather than a named accent:
  // import { setAccent } from 'kanto-ds'; setAccent('#e11d48');
}
