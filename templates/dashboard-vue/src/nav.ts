/**
 * Where everything is: the routes, the sidebar that leads to them, and the
 * Cmd+K commands that jump to them. Add a screen here and in the router, and
 * the sidebar and the palette both know about it.
 */
import type { KtCommand, KtNavItem, KtNavSection } from 'kanto-ds';

export type Screen =
  | 'home'
  | 'inbox'
  | 'customers'
  | 'files'
  | 'activity'
  | 'integrations'
  | 'general'
  | 'people'
  | 'roles'
  | 'notifications'
  | 'security';

export interface Route {
  readonly path: string;
  readonly title: string;
  readonly screen: Screen;
  /** Where the screen sits, for its page header. */
  readonly section: string;
  readonly icon: string;
}

export const ROUTES: readonly Route[] = [
  { path: '/', title: 'Home', screen: 'home', section: 'Workspace', icon: 'house' },
  { path: '/inbox', title: 'Inbox', screen: 'inbox', section: 'Workspace', icon: 'inbox' },
  {
    path: '/customers',
    title: 'Customers',
    screen: 'customers',
    section: 'Workspace',
    icon: 'users',
  },
  { path: '/files', title: 'Files', screen: 'files', section: 'Workspace', icon: 'folder' },
  {
    path: '/activity',
    title: 'Activity',
    screen: 'activity',
    section: 'System',
    icon: 'activity',
  },
  {
    path: '/integrations',
    title: 'Integrations',
    screen: 'integrations',
    section: 'System',
    icon: 'plug',
  },
  {
    path: '/settings/general',
    title: 'General',
    screen: 'general',
    section: 'Settings',
    icon: 'settings',
  },
  {
    path: '/settings/members/people',
    title: 'People',
    screen: 'people',
    section: 'Settings',
    icon: 'users',
  },
  {
    path: '/settings/members/roles',
    title: 'Roles',
    screen: 'roles',
    section: 'Settings',
    icon: 'shield',
  },
  {
    path: '/settings/notifications',
    title: 'Notifications',
    screen: 'notifications',
    section: 'Settings',
    icon: 'bell',
  },
  {
    path: '/settings/security',
    title: 'Security',
    screen: 'security',
    section: 'Settings',
    icon: 'key-round',
  },
];

export const routeFor = (path: string): Route | undefined =>
  ROUTES.find((route) => route.path === path);

export const titleFor = (path: string): string => routeFor(path)?.title ?? 'Not found';

/** A route's link, as the sidebar and `<a href>` want it. */
export const hrefFor = (path: string): string => `#${path}`;

const link = (path: string, extra: Partial<KtNavItem> = {}): KtNavItem => {
  const route = routeFor(path)!;
  return { label: route.title, href: hrefFor(path), ...extra };
};

/** The sidebar. Settings nests three levels down: Settings › Members › People. */
export const NAV: readonly KtNavSection[] = [
  {
    title: 'Workspace',
    items: [
      link('/', { icon: 'house' }),
      link('/inbox', { icon: 'inbox' }),
      link('/customers', { icon: 'users' }),
      link('/files', { icon: 'folder' }),
    ],
  },
  {
    title: 'System',
    items: [link('/activity', { icon: 'activity' }), link('/integrations', { icon: 'plug' })],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Settings',
        icon: 'settings',
        children: [
          link('/settings/general'),
          {
            label: 'Members',
            children: [link('/settings/members/people'), link('/settings/members/roles')],
          },
          link('/settings/notifications'),
          link('/settings/security'),
        ],
      },
    ],
  },
];

/** The sidebar with the inbox's unread count beside it. */
export function navWithUnread(unread: number): KtNavSection[] {
  const inbox = hrefFor('/inbox');
  return NAV.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.href === inbox && unread > 0 ? { ...item, badge: String(unread) } : item,
    ),
  }));
}

/** Cmd+K: one command per screen. Its id is the path to go to. */
export const COMMANDS: readonly KtCommand[] = ROUTES.map((route) => ({
  id: route.path,
  label: route.section === 'Settings' ? `Settings: ${route.title}` : route.title,
  group: 'Go to',
  icon: route.icon,
}));
