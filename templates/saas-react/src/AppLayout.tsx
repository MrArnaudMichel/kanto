import { Outlet, useLocation, useNavigate } from 'react-router';
import { currentSession, signOut } from './auth';
import { APP_NAME, NAV, USER_MENU } from './content';

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = currentSession();
  return (
    <kt-app-shell className="app" label={APP_NAME}>
      <div slot="header" className="app-header">
        <a className="app-brand" href="#/">
          {APP_NAME}
        </a>
        <kt-user-menu
          name={session?.name ?? ''}
          email={session?.email ?? ''}
          items={USER_MENU}
          onkt-select={(event) => {
            if (event.detail.id === 'sign-out') {
              signOut();
              navigate('/sign-in');
            } else navigate('/settings');
          }}
        />
      </div>
      <kt-sub-menu-navigation
        slot="sidebar"
        label="Workspace"
        sections={NAV}
        activeHref={`#${pathname}`}
      />
      <div className="page">
        <Outlet />
      </div>
    </kt-app-shell>
  );
}
