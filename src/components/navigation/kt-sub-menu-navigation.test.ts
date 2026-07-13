import { beforeEach, describe, expect, it } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-sub-menu-navigation.js';
import type { KtNavSection, KtSubMenuNavigation } from './kt-sub-menu-navigation.js';

const SECTIONS: KtNavSection[] = [
  {
    title: 'Forms',
    items: [
      { label: 'Input', href: '/input' },
      { label: 'Select', href: '/select' },
    ],
  },
  { items: [{ label: 'Changelog', href: '/changelog' }] },
];

const links = (el: KtSubMenuNavigation) => [
  ...el.shadowRoot!.querySelectorAll<HTMLAnchorElement>('.item'),
];

describe('kt-sub-menu-navigation', () => {
  let el: KtSubMenuNavigation;

  beforeEach(async () => {
    el = await fixture<KtSubMenuNavigation>('<kt-sub-menu-navigation></kt-sub-menu-navigation>');
    el.sections = SECTIONS;
    await settle(el);
  });

  it('renders every section and item', () => {
    expect(links(el)).toHaveLength(3);
    expect(el.shadowRoot!.querySelectorAll('.title')).toHaveLength(1);
  });

  it('marks the item matching active-href', async () => {
    el.activeHref = '/select';
    await settle(el);

    const active = links(el).filter((a) => a.classList.contains('active'));
    expect(active).toHaveLength(1);
    expect(active[0]!.textContent).toBe('Select');
    expect(active[0]!.getAttribute('aria-current')).toBe('page');
  });

  it('honours an explicit active flag on the item', async () => {
    el.sections = [{ items: [{ label: 'Ad hoc', active: true }] }];
    await settle(el);
    expect(links(el)[0]!.classList.contains('active')).toBe(true);
  });

  it('marks nothing active when active-href matches nothing', async () => {
    el.activeHref = '/nowhere';
    await settle(el);
    expect(links(el).filter((a) => a.classList.contains('active'))).toHaveLength(0);
  });

  it('lets a router intercept a click', () => {
    const seen: { item: { href?: string } }[] = [];
    el.addEventListener('kt-navigate', (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent<{ item: { href?: string } }>).detail);
    });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    links(el)[0]!.dispatchEvent(event);

    expect(seen[0]!.item.href).toBe('/input');
    expect(event.defaultPrevented).toBe(true);
  });
});
