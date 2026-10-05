/**
 * The brand, in one place. Every option:
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
}
