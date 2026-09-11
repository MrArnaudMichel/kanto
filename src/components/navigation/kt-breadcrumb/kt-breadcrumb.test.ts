import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-breadcrumb.js';
import type { KtBreadcrumb, KtBreadcrumbItem } from 'kanto';

const ITEMS: KtBreadcrumbItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Entities', href: '/entites' },
  { label: 'Entity 4812' },
];

const links = (el: KtBreadcrumb) => [...el.shadowRoot!.querySelectorAll('a')];
const current = (el: KtBreadcrumb) => el.shadowRoot!.querySelector('.current')!;

describe('kt-breadcrumb', () => {
  let el: KtBreadcrumb;

  beforeEach(async () => {
    el = await fixture<KtBreadcrumb>('<kt-breadcrumb></kt-breadcrumb>');
    el.items = ITEMS;
    await settle(el);
  });

  it('links every entry except the last', () => {
    expect(links(el).map((a) => a.textContent)).toEqual(['Accueil', 'Entities']);
    expect(current(el).textContent).toBe('Entity 4812');
    expect(current(el).getAttribute('aria-current')).toBe('page');
  });

  it('puts a separator between entries and none after the last', () => {
    expect(el.shadowRoot!.querySelectorAll('.separator')).toHaveLength(2);
  });

  it('names the landmark', () => {
    expect(el.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('reports activation and lets a listener take over routing', async () => {
    const listener = vi.fn((e: Event) => e.preventDefault());
    el.addEventListener('kt-navigate', listener);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    links(el)[0]!.dispatchEvent(event);

    expect(listener).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('follows the href when nothing cancels', async () => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    links(el)[0]!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves modified clicks to the browser', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-navigate', listener);

    links(el)[0]!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }),
    );

    expect(listener).not.toHaveBeenCalled();
  });

  it('renders nothing for an empty trail', async () => {
    el.items = [];
    await settle(el);
    expect(links(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('.current')).toBeNull();
  });
});
