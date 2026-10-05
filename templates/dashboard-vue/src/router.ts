import { createRouter, createWebHashHistory, type RouteComponent } from 'vue-router';
import { ROUTES, type Screen } from './nav';
import ActivityScreen from './screens/ActivityScreen.vue';
import CustomersScreen from './screens/CustomersScreen.vue';
import FilesScreen from './screens/FilesScreen.vue';
import GeneralScreen from './screens/GeneralScreen.vue';
import HomeScreen from './screens/HomeScreen.vue';
import InboxScreen from './screens/InboxScreen.vue';
import IntegrationsScreen from './screens/IntegrationsScreen.vue';
import NotFoundScreen from './screens/NotFoundScreen.vue';
import NotificationsScreen from './screens/NotificationsScreen.vue';
import PeopleScreen from './screens/PeopleScreen.vue';
import RolesScreen from './screens/RolesScreen.vue';
import SecurityScreen from './screens/SecurityScreen.vue';
import Shell from './Shell.vue';

const SCREENS: Record<Screen, RouteComponent> = {
  home: HomeScreen,
  inbox: InboxScreen,
  customers: CustomersScreen,
  files: FilesScreen,
  activity: ActivityScreen,
  integrations: IntegrationsScreen,
  general: GeneralScreen,
  people: PeopleScreen,
  roles: RolesScreen,
  notifications: NotificationsScreen,
  security: SecurityScreen,
};

/** Every screen inside the shell; anything else is a page that is not there. */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: Shell,
      children: [
        ...ROUTES.map((route) => ({ path: route.path, component: SCREENS[route.screen] })),
        { path: '/:rest(.*)*', component: NotFoundScreen },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
