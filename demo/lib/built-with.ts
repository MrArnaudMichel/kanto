/**
 * Products built with Kanto, for the Apps showcase: a card each. To add one,
 * open an issue with the showcase form — SHOW_YOURS — or a pull request here,
 * with a 1400×860 screenshot in demo/public/apps/.
 */
export interface BuiltWith {
  readonly name: string;
  readonly url: string;
  readonly description: string;
  /** Under demo/public/. */
  readonly image: string;
  readonly by: string;
}

export const BUILT_WITH: readonly BuiltWith[] = [
  {
    name: 'Kanto',
    url: 'https://kanto.arnaudmichel.fr',
    description:
      'This site: the docs, the playground and the live demos, built from Kanto’s own components.',
    image: 'apps/kanto.png',
    by: 'Arnaud Michel',
  },
];

export const SHOW_YOURS =
  'https://github.com/MrArnaudMichel/kanto/issues/new?template=showcase.yml';
