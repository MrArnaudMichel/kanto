import type { ReactElement } from 'react';
import { createHashRouter } from 'react-router';
import { ROUTES, type Screen } from './nav';
import { Activity } from './screens/Activity';
import { Customers } from './screens/Customers';
import { Files } from './screens/Files';
import { Home } from './screens/Home';
import { Inbox } from './screens/Inbox';
import { Integrations } from './screens/Integrations';
import { General, Notifications, People, Roles, Security } from './screens/Settings';
import { Shell } from './Shell';

const SCREENS: Record<Screen, () => ReactElement> = {
  home: Home,
  inbox: Inbox,
  customers: Customers,
  files: Files,
  activity: Activity,
  integrations: Integrations,
  general: General,
  people: People,
  roles: Roles,
  notifications: Notifications,
  security: Security,
};

/** Every screen inside the shell; anything else is a page that is not there. */
export const router = createHashRouter([
  {
    element: <Shell />,
    children: [
      ...ROUTES.map((route) => {
        const Screen = SCREENS[route.screen];
        return { path: route.path, element: <Screen /> };
      }),
      { path: '*', element: <kt-error-page homeHref="#/" /> },
    ],
  },
]);
