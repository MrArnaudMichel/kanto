import { redirectFor } from './guard';
import { inShell } from './layout';
import { authPage } from './pages/auth';
import { customersPage } from './pages/customers';
import { dashboardPage } from './pages/dashboard';
import { notFoundPage } from './pages/not-found';
import { settingsPage } from './pages/settings';
import { welcomePage } from './pages/welcome';
import type { RouteTable } from './router';

export const ROUTES: RouteTable = {
  routes: [
    { path: '/sign-in', render: (outlet) => authPage(outlet, 'sign-in') },
    { path: '/sign-up', render: (outlet) => authPage(outlet, 'sign-up') },
    { path: '/welcome', render: inShell('/welcome', welcomePage) },
    { path: '/', render: inShell('/', dashboardPage) },
    { path: '/customers', render: inShell('/customers', customersPage) },
    { path: '/settings', render: inShell('/settings', settingsPage) },
  ],
  notFound: { path: '*', render: notFoundPage },
  redirect: redirectFor,
};
