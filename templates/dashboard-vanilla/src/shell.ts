/**
 * The console's frame: the sidebar, the top bar, Cmd+K and the cookie notice,
 * built once. Screens render into its `outlet`; the router tells it where the
 * reader is.
 */
import {
  toaster,
  type KtButton,
  type KtCommandPalette,
  type KtDropdown,
  type KtSubMenuNavigation,
} from 'kanto-ds';
import { PERSON, STORAGE, WORKSPACE } from './data/fixtures';
import { el, icon } from './dom';
import { COMMANDS, hrefFor, navWithUnread } from './nav';
import { navigate } from './router';

export interface Shell {
  /** Where the screens draw. */
  readonly outlet: HTMLElement;
  /** Marks the screen at `path` in the sidebar, and closes the drawer on a phone. */
  setActive(path: string): void;
  /** The unread mail count, on the bell and beside Inbox. */
  setUnread(count: number): void;
}

const COOKIES_KEY = 'northwind-console-cookies';

const remembered = (): boolean => {
  try {
    return localStorage.getItem(COOKIES_KEY) !== null;
  } catch {
    return false;
  }
};

export function createShell(root: HTMLElement): Shell {
  let unread = 0;

  // === The sidebar ===

  const nav = el<KtSubMenuNavigation>('kt-sub-menu-navigation', {
    class: 'app-nav',
    flush: true,
    label: WORKSPACE.name,
  });
  nav.sections = navWithUnread(unread);

  const palette = el<KtCommandPalette>('kt-command-palette', {
    placeholder: 'Search screens and settings…',
  });
  palette.commands = COMMANDS;
  palette.addEventListener('kt-select', (event) => {
    navigate((event as CustomEvent<{ id: string }>).detail.id);
  });
  const openPalette = () => {
    palette.open = true;
  };

  const search = el('button', { type: 'button', class: 'app-search' }, [
    icon('search'),
    el('span', {}, ['Search…']),
    el('kt-kbd', { keys: 'mod k' }),
  ]);
  search.addEventListener('click', openPalette);

  const account = el<KtDropdown>('kt-dropdown', { 'preferred-placement': 'top' }, [
    el('button', { type: 'button', slot: 'trigger', class: 'account' }, [
      el('kt-avatar', { name: PERSON.name, size: 'small', status: 'online' }),
      el('span', { class: 'account-copy' }, [
        el('span', { class: 'account-name' }, [PERSON.name]),
        el('span', { class: 'account-mail' }, [PERSON.email]),
      ]),
      icon('chevrons-up-down', 14),
    ]),
  ]);
  account.options = [
    { id: 'people', label: 'Members' },
    { id: 'security', label: 'Security' },
    { id: 'out', label: 'Sign out' },
  ];
  account.addEventListener('kt-select', (event) => {
    const { value } = (event as CustomEvent<{ value: string }>).detail;
    if (value === 'people') navigate('/settings/members/people');
    else if (value === 'security') navigate('/settings/security');
    else toaster.info('Signing out goes to your auth provider: see src/shell.ts.');
  });

  const sidebar = el('aside', { class: 'app-sidebar' }, [
    el('a', { class: 'brand', href: hrefFor('/') }, [
      el('span', { class: 'brand-mark' }, [icon('layers', 18)]),
      el('span', { class: 'brand-copy' }, [
        el('span', { class: 'brand-name' }, [WORKSPACE.name]),
        el('span', { class: 'brand-sub' }, [WORKSPACE.tagline]),
      ]),
    ]),
    search,
    nav,
    el('div', { class: 'app-sidebar-footer' }, [
      el('div', { class: 'storage' }, [
        el('kt-meter', {
          label: 'Storage',
          used: `${STORAGE.used} GB`,
          total: `of ${STORAGE.total} GB`,
          value: Math.round((STORAGE.used / STORAGE.total) * 100),
        }),
      ]),
      el('span', { class: 'node-status' }, [
        el('span', { class: 'node-dot' }),
        el('span', { class: 'node-label' }, [`${WORKSPACE.node} · healthy`]),
      ]),
      account,
    ]),
  ]);

  // === The top bar ===

  const app = el('div', { class: 'app' });

  const menu = el<KtButton>('kt-button', {
    class: 'menu-button',
    variant: 'secondary-no-bg',
    size: 'small',
    icon: 'menu',
    label: 'Open the menu',
  });
  menu.expanded = false;
  menu.addEventListener('click', () => {
    app.classList.add('nav-open');
    menu.expanded = true;
    // Into the drawer: the keyboard starts where the eye does.
    search.focus();
  });

  const collapse = el('kt-button', {
    class: 'collapse-button',
    variant: 'secondary-no-bg',
    size: 'small',
    icon: 'panel-left',
    label: 'Collapse the sidebar',
  });
  collapse.addEventListener('click', () => {
    const collapsed = app.classList.toggle('collapsed');
    nav.collapsed = collapsed;
    collapse.setAttribute('label', collapsed ? 'Expand the sidebar' : 'Collapse the sidebar');
  });

  const topSearch = el('button', { type: 'button', class: 'topbar-search' }, [
    icon('search'),
    el('span', {}, ['Search customers, files and settings…']),
    el('kt-kbd', { keys: 'mod k' }),
  ]);
  topSearch.setAttribute('aria-label', 'Search');
  topSearch.addEventListener('click', openPalette);

  const bellCount = el('span', { class: 'bell-count' });
  const bell = el('kt-button', {
    variant: 'secondary-no-bg',
    size: 'small',
    icon: 'bell',
    label: 'Notifications',
  });
  bell.addEventListener('click', () => navigate('/inbox'));

  const outlet = el('main', { class: 'app-content' });

  // === Cookies, asked once ===

  const cookies = el('div', { class: 'cookie-bar' });
  if (!remembered()) {
    const answer = (choice: string) => () => {
      try {
        localStorage.setItem(COOKIES_KEY, choice);
      } catch {
        // Private browsing: asked again next visit.
      }
      cookies.remove();
    };
    const accept = el('kt-button', { slot: 'actions', size: 'small' }, ['Accept']);
    accept.addEventListener('click', answer('accepted'));
    const refuse = el('kt-button', { slot: 'actions', size: 'small', variant: 'secondary-no-bg' }, [
      'Opt out',
    ]);
    refuse.addEventListener('click', answer('refused'));
    cookies.append(
      el(
        'kt-alert',
        {
          'no-icon': true,
          variant: 'neutral',
          description: 'We use first-party cookies to understand how the console is used.',
        },
        [accept, refuse],
      ),
    );
  }

  // === The drawer, on a phone ===

  const scrim = el('div', { class: 'scrim' });
  const closeDrawer = () => {
    app.classList.remove('nav-open');
    menu.expanded = false;
  };
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  app.append(
    sidebar,
    scrim,
    el('div', { class: 'app-main' }, [
      el('header', { class: 'app-topbar' }, [
        menu,
        collapse,
        topSearch,
        el('div', { class: 'app-topbar-actions' }, [
          el('kt-tooltip', { text: 'Notifications' }, [
            el('span', { class: 'bell' }, [bell, bellCount]),
          ]),
        ]),
      ]),
      outlet,
    ]),
    palette,
    ...(remembered() ? [] : [cookies]),
  );
  root.replaceChildren(app);

  return {
    outlet,
    setActive(path) {
      nav.activeHref = hrefFor(path);
      closeDrawer();
    },
    setUnread(count) {
      unread = count;
      nav.sections = navWithUnread(unread);
      bellCount.textContent = String(count);
      bellCount.hidden = count === 0;
    },
  };
}
