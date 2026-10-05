import { createHashRouter } from 'react-router';
import { AppLayout } from './AppLayout';
import { Guarded } from './guards';
import { AuthPage } from './pages/AuthPage';
import { Customers } from './pages/Customers';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';

export const router = createHashRouter([
  {
    path: '/sign-in',
    element: (
      <Guarded>
        <AuthPage mode="sign-in" />
      </Guarded>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <Guarded>
        <AuthPage mode="sign-up" />
      </Guarded>
    ),
  },
  {
    element: (
      <Guarded>
        <AppLayout />
      </Guarded>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/welcome', element: <Welcome /> },
      { path: '/customers', element: <Customers /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
