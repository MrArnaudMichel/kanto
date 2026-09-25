/**
 * The copy Kanto's elements write themselves, and the way to translate it.
 *
 *     import { setStrings } from 'kanto-ds/strings';
 *
 *     setStrings({ clear: 'Effacer', noData: 'Aucune donnée' });
 *
 * A light entry point: it loads no element, so it can run before any of them.
 * The same functions are exported from `kanto-ds`.
 */
export {
  defaultStrings,
  resetStrings,
  setStrings,
  strings as getStrings,
  type KtStrings,
} from '#internal/strings';
