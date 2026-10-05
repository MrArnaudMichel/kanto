import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import { applyBrand } from './brand';
import { el } from './dom';
import { watchUnread } from './mail';
import { ROUTES, titleFor, type Screen } from './nav';
import { startRouter } from './router';
import { activity } from './screens/activity';
import { customers } from './screens/customers';
import { files } from './screens/files';
import { home } from './screens/home';
import { inbox } from './screens/inbox';
import { integrations } from './screens/integrations';
import { general, notifications, people, roles, security } from './screens/settings';
import { createShell } from './shell';

applyBrand();

type Render = (outlet: HTMLElement) => void | (() => void);

const SCREENS: Record<Screen, Render> = {
  home,
  inbox,
  customers,
  files,
  activity,
  integrations,
  general,
  people,
  roles,
  notifications,
  security,
};

const shell = createShell(document.querySelector<HTMLElement>('#app')!);
watchUnread((count) => shell.setUnread(count));

/** Each route draws its screen in the shell, and marks itself in the sidebar. */
const inShell =
  (path: string, render: Render): Render =>
  (outlet) => {
    shell.setActive(path);
    document.title = `${titleFor(path)} — Northwind`;
    window.scrollTo(0, 0);
    return render(outlet);
  };

startRouter(shell.outlet, {
  routes: ROUTES.map((route) => ({
    path: route.path,
    render: inShell(route.path, SCREENS[route.screen]),
  })),
  notFound: {
    path: '',
    render: inShell('', (outlet) => {
      outlet.append(el('kt-error-page', { 'home-href': '#/' }));
    }),
  },
  redirect: () => null,
});
