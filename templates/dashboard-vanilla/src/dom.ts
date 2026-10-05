/** Building the page in code: text goes in as text, never as markup. */
import type { Tile } from './data/api';

type Attributes = Record<string, string | number | boolean | undefined>;

/** An element, its attributes, and its children. */
export function el<T extends HTMLElement = HTMLElement>(
  tag: string,
  attributes: Attributes = {},
  children: (Node | string)[] = [],
): T {
  const node = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) node.setAttribute(name, '');
    else if (value !== false && value !== undefined) node.setAttribute(name, String(value));
  }
  node.append(...children);
  return node;
}

/** A button that does something when pressed. */
export function button(
  label: string,
  attributes: Attributes,
  onClick: (event: Event) => void,
): HTMLElement {
  const node = el('kt-button', attributes, [label]);
  node.addEventListener('click', onClick);
  return node;
}

export const icon = (name: string, size = 16, style?: string): HTMLElement =>
  el('kt-icon', { name, size, style });

/** A page's header: where it is, what it is, what it is for, and its actions. */
export function pageHeader(
  eyebrow: string,
  heading: string,
  description: string,
  actions: HTMLElement[] = [],
): HTMLElement {
  for (const action of actions) action.setAttribute('slot', 'actions');
  return el('kt-page-header', { eyebrow, heading, description }, actions);
}

/** A section's header inside a page, with a link on the right. */
export function sectionHeader(
  heading: string,
  link?: { label: string; href: string },
): HTMLElement {
  return el(
    'kt-page-header',
    { level: 'section', heading },
    link ? [el('a', { slot: 'actions', href: link.href }, [link.label])] : [],
  );
}

/** A figure with its icon chip: the overview's and the files' tiles. */
export function tile(figure: Tile, loading = false): HTMLElement {
  return el('kt-card', { class: 'tile' }, [
    el('span', { class: `tile-icon ${figure.tone}` }, [icon(figure.icon, 18)]),
    el('kt-stat', {
      label: figure.label,
      value: figure.value,
      delta: figure.delta,
      trend: figure.trend,
      inverted: figure.inverted === true,
      loading,
    }),
  ]);
}

/** A screen's root: the class the stylesheet and the tests find it by. */
export const screen = (name: string, children: (Node | string)[] = []): HTMLElement =>
  el('div', { class: `screen screen-${name}` }, children);
