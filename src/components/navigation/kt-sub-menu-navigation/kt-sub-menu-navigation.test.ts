import { beforeEach, describe, expect, it } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-sub-menu-navigation.js';
import type { KtNavSection, KtSubMenuNavigation } from 'kanto-ds';

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
  ...el.shadowRoot!.querySelectorAll<HTMLAnchorElement>('a.item'),
];

const rows = (el: KtSubMenuNavigation) =>
  [...el.shadowRoot!.querySelectorAll<HTMLElement>('.item')].map((e) =>
    e.querySelector('.label')!.textContent!.trim(),
  );

const branch = (el: KtSubMenuNavigation, label: string) =>
  [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.item')].find(
    (b) => b.querySelector('.label')!.textContent!.trim() === label,
  )!;

const NESTED: KtNavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Home', href: '#/home', icon: 'house' },
      {
        label: 'Settings',
        icon: 'settings',
        children: [
          { label: 'General', href: '#/settings/general' },
          {
            label: 'Members',
            children: [
              { label: 'People', href: '#/settings/members/people' },
              { label: 'Roles', href: '#/settings/members/roles' },
            ],
          },
        ],
      },
    ],
  },
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
    expect(active[0]!.textContent!.trim()).toBe('Select');
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

  it('renders a branch as a button rather than a link', async () => {
    el.sections = NESTED;
    await settle(el);
    expect(branch(el, 'Settings').getAttribute('aria-expanded')).toBe('false');
    expect(links(el).map((a) => a.getAttribute('href'))).toEqual(['#/home']);
  });

  it('opens and closes a branch on click', async () => {
    el.sections = NESTED;
    await settle(el);

    branch(el, 'Settings').click();
    await settle(el);
    expect(rows(el)).toContain('General');
    expect(branch(el, 'Settings').getAttribute('aria-expanded')).toBe('true');

    branch(el, 'Settings').click();
    await settle(el);
    expect(rows(el)).not.toContain('General');
  });

  it('nests to any depth, indenting by it', async () => {
    el.sections = NESTED;
    await settle(el);
    branch(el, 'Settings').click();
    await settle(el);
    branch(el, 'Members').click();
    await settle(el);

    expect(rows(el)).toEqual(['Home', 'Settings', 'General', 'Members', 'People', 'Roles']);
    const roles = links(el).find((a) => a.getAttribute('href') === '#/settings/members/roles')!;
    expect(roles.style.getPropertyValue('--depth')).toBe('2');
  });

  it('opens every branch down to the active page, unasked', async () => {
    // Navigating to a page the sidebar does not show is worse than losing a
    // fold, so the active branch wins over a collapsed default.
    el.sections = NESTED;
    el.activeHref = '#/settings/members/roles';
    await settle(el);

    expect(rows(el)).toContain('Roles');
    expect(branch(el, 'Settings').getAttribute('aria-expanded')).toBe('true');
    expect(branch(el, 'Settings').classList.contains('within')).toBe(true);
    expect(branch(el, 'Settings').classList.contains('active')).toBe(false);
  });

  it('refuses to fold a branch that holds the active page', async () => {
    el.sections = NESTED;
    el.activeHref = '#/settings/general';
    await settle(el);

    branch(el, 'Settings').click();
    await settle(el);
    expect(rows(el)).toContain('General');
  });

  it('honours an item asking to start open', async () => {
    el.sections = [
      { items: [{ label: 'Reports', open: true, children: [{ label: 'Weekly', href: '/w' }] }] },
    ];
    await settle(el);
    expect(rows(el)).toContain('Weekly');
  });

  it('announces a branch toggle', async () => {
    el.sections = NESTED;
    await settle(el);

    const seen: { item: { label: string }; open: boolean }[] = [];
    el.addEventListener('kt-toggle', (e) =>
      seen.push((e as CustomEvent<{ item: { label: string }; open: boolean }>).detail),
    );
    branch(el, 'Settings').click();
    expect(seen).toHaveLength(1);
    expect(seen[0]!.open).toBe(true);
    expect(seen[0]!.item.label).toBe('Settings');
  });

  it('hides the labels rather than clipping them when collapsed', async () => {
    el.sections = NESTED;
    el.collapsed = true;
    await settle(el);
    expect(el.hasAttribute('collapsed')).toBe(true);
    expect(el.shadowRoot!.querySelector('kt-icon[name="house"]')).not.toBeNull();
  });

  it('gives a branch row the same width as a link row', async () => {
    // A <button> sizes to its content even as a flex container, so without an
    // explicit width the hover fill stopped at the end of the word.
    el.sections = NESTED;
    await settle(el);

    const branchRow = branch(el, 'Settings');
    expect(getComputedStyle(branchRow).width).toBe('100%');
    expect(getComputedStyle(branchRow).boxSizing).toBe('border-box');
  });
});
