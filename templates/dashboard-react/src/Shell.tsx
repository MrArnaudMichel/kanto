/**
 * The console's frame: the sidebar, the top bar, Cmd+K and the cookie notice.
 * Screens render in its outlet.
 */
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { toaster, type KtCommandPalette } from 'kanto-ds';
import { PERSON, STORAGE, WORKSPACE } from './data/fixtures';
import { useMail } from './mail';
import { COMMANDS, hrefFor, navWithUnread, titleFor } from './nav';
import { unreadCount } from './views';

const COOKIES_KEY = 'northwind-console-cookies';

function cookiesAnswered(): boolean {
  try {
    return localStorage.getItem(COOKIES_KEY) !== null;
  } catch {
    return false;
  }
}

const ACCOUNT_MENU = [
  { id: 'people', label: 'Members' },
  { id: 'security', label: 'Security' },
  { id: 'out', label: 'Sign out' },
];

export function Shell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mail = useMail();
  const unread = mail ? unreadCount(mail) : 0;
  const palette = useRef<KtCommandPalette>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [cookies, setCookies] = useState(cookiesAnswered);

  // A new screen: its title, the top of the page, and the drawer closed.
  useEffect(() => {
    document.title = `${titleFor(pathname)} — Northwind`;
    window.scrollTo(0, 0);
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const openPalette = () => {
    if (palette.current) palette.current.open = true;
  };

  const answer = (choice: string) => {
    try {
      localStorage.setItem(COOKIES_KEY, choice);
    } catch {
      // Private browsing: asked again next visit.
    }
    setCookies(true);
  };

  const classes = ['app', collapsed ? 'collapsed' : '', drawer ? 'nav-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <aside className="app-sidebar">
        <a className="brand" href={hrefFor('/')}>
          <span className="brand-mark">
            <kt-icon name="layers" size={18} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">{WORKSPACE.name}</span>
            <span className="brand-sub">{WORKSPACE.tagline}</span>
          </span>
        </a>

        <button type="button" className="app-search" onClick={openPalette}>
          <kt-icon name="search" size={16} />
          <span>Search…</span>
          <kt-kbd keys="mod k" />
        </button>

        <kt-sub-menu-navigation
          className="app-nav"
          flush
          label={WORKSPACE.name}
          collapsed={collapsed}
          sections={navWithUnread(unread)}
          activeHref={hrefFor(pathname)}
        />

        <div className="app-sidebar-footer">
          <div className="storage">
            <kt-meter
              label="Storage"
              used={`${STORAGE.used} GB`}
              total={`of ${STORAGE.total} GB`}
              value={Math.round((STORAGE.used / STORAGE.total) * 100)}
            />
          </div>
          <span className="node-status">
            <span className="node-dot" />
            <span className="node-label">{`${WORKSPACE.node} · healthy`}</span>
          </span>
          <kt-dropdown
            preferredPlacement="top"
            options={ACCOUNT_MENU}
            onkt-select={(event) => {
              const { value } = event.detail;
              if (value === 'people') navigate('/settings/members/people');
              else if (value === 'security') navigate('/settings/security');
              else toaster.info('Signing out goes to your auth provider: see src/Shell.tsx.');
            }}
          >
            <button type="button" slot="trigger" className="account">
              <kt-avatar name={PERSON.name} size="small" status="online" />
              <span className="account-copy">
                <span className="account-name">{PERSON.name}</span>
                <span className="account-mail">{PERSON.email}</span>
              </span>
              <kt-icon name="chevrons-up-down" size={14} />
            </button>
          </kt-dropdown>
        </div>
      </aside>
      <div className="scrim" onClick={() => setDrawer(false)} />

      <div className="app-main">
        <header className="app-topbar">
          <kt-button
            className="menu-button"
            variant="secondary-no-bg"
            size="small"
            icon="menu"
            label="Open the menu"
            onClick={() => setDrawer(true)}
          />
          <kt-button
            className="collapse-button"
            variant="secondary-no-bg"
            size="small"
            icon="panel-left"
            label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            onClick={() => setCollapsed((now) => !now)}
          />
          <button type="button" className="topbar-search" aria-label="Search" onClick={openPalette}>
            <kt-icon name="search" size={16} />
            <span>Search customers, files and settings…</span>
            <kt-kbd keys="mod k" />
          </button>
          <div className="app-topbar-actions">
            <kt-tooltip text="Notifications">
              <span className="bell">
                <kt-button
                  variant="secondary-no-bg"
                  size="small"
                  icon="bell"
                  label="Notifications"
                  onClick={() => navigate('/inbox')}
                />
                <span className="bell-count" hidden={unread === 0}>
                  {unread}
                </span>
              </span>
            </kt-tooltip>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <kt-command-palette
        ref={palette}
        placeholder="Search screens and settings…"
        commands={COMMANDS}
        onkt-select={(event) => navigate(event.detail.id)}
      />

      {cookies ? null : (
        <div className="cookie-bar">
          <kt-alert
            noIcon
            variant="neutral"
            description="We use first-party cookies to understand how the console is used."
          >
            <kt-button slot="actions" size="small" onClick={() => answer('accepted')}>
              Accept
            </kt-button>
            <kt-button
              slot="actions"
              size="small"
              variant="secondary-no-bg"
              onClick={() => answer('refused')}
            >
              Opt out
            </kt-button>
          </kt-alert>
        </div>
      )}
    </div>
  );
}
