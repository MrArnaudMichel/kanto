import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from './AppLayout.vue';
import { redirectFor } from './guard';
import AuthPage from './pages/AuthPage.vue';
import CustomersPage from './pages/CustomersPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import NotFoundPage from './pages/NotFoundPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import WelcomePage from './pages/WelcomePage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/sign-in', component: AuthPage, props: { mode: 'sign-in' } },
    { path: '/sign-up', component: AuthPage, props: { mode: 'sign-up' } },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', component: DashboardPage },
        { path: 'welcome', component: WelcomePage },
        { path: 'customers', component: CustomersPage },
        { path: 'settings', component: SettingsPage },
      ],
    },
    { path: '/:rest(.*)*', component: NotFoundPage, meta: { notFound: true } },
  ],
});

router.beforeEach((to) => redirectFor(to.path, !to.meta.notFound) ?? true);
