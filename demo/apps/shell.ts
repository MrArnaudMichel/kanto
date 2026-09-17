import { html, nothing, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import type { KtNavItem, KtNavSection } from 'kanto-ds';
import { rerender } from '../lib/render.js';

/**
 * The console's own chrome.
 *
 * This is the point of the whole exercise: a real application shell, built only
 * from Kanto elements, that the component pages can be judged against. A
 * gallery shows that a button exists; this shows what happens when forty of
 * them have to share a screen.
 *
 * The sidebar is `<kt-sub-menu-navigation>` rather than markup written for this
 * screen — including the three-level branch under Administration. That was the
 * test: if the console has to hand-roll its own nesting, the component is not
 * finished.
 */

export const appHref = (path: string) => `#/app/console/${path}`;

export const NAV: readonly KtNavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Home', href: appHref('home'), icon: 'house' },
      { label: 'Inbox', href: appHref('inbox'), icon: 'inbox', badge: '4' },
      { label: 'Customers', href: appHref('customers'), icon: 'users' },
      { label: 'Files', href: appHref('files'), icon: 'folder' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Activity', href: appHref('activity'), icon: 'activity' },
      { label: 'Integrations', href: appHref('integrations'), icon: 'plug', badge: '3' },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Settings',
        icon: 'settings',
        children: [
          { label: 'General', href: appHref('settings/general') },
          {
            label: 'Members',
            children: [
              { label: 'People', href: appHref('settings/members/people') },
              { label: 'Roles', href: appHref('settings/members/roles') },
            ],
          },
          { label: 'Notifications', href: appHref('settings/notifications') },
          { label: 'Security', href: appHref('settings/security') },
        ],
      },
    ],
  },
];

interface ShellState {
  collapsed: boolean;
  paletteOpen: boolean;
  paletteQuery: string;
  cookiesAccepted: boolean;
  unread: number;
}

export const shellState: ShellState = {
  collapsed: false,
  paletteOpen: false,
  paletteQuery: '',
  cookiesAccepted: false,
  unread: 4,
};

/** Every leaf in NAV, flattened — the palette and the tests both want it. */
export function navLeaves(
  sections: readonly KtNavSection[] = NAV,
): { label: string; href: string; icon: string }[] {
  const out: { label: string; href: string; icon: string }[] = [];

  const walk = (items: readonly KtNavItem[], icon: string) => {
    for (const item of items) {
      const own = item.icon ?? icon;
      if (item.href) out.push({ label: item.label, href: item.href, icon: own });
      if (item.children) walk(item.children, own);
    }
  };

  for (const section of sections) walk(section.items, 'circle');
  return out;
}

function commandPalette(): TemplateResult {
  const commands = [
    ...navLeaves().map((leaf) => ({ ...leaf, hint: 'Go to' })),
    {
      label: 'Back to the documentation',
      hint: 'Leave',
      icon: 'book-open',
      href: '#/guide/introduction',
    },
  ];
  const needle = shellState.paletteQuery.trim().toLowerCase();
  const matches = needle
    ? commands.filter((c) => c.label.toLowerCase().includes(needle))
    : commands;

  return html`<kt-modal
    ?open=${shellState.paletteOpen}
    size="small"
    no-close-button
    @kt-close=${() => {
      shellState.paletteOpen = false;
      shellState.paletteQuery = '';
      rerender();
    }}
  >
    <div slot="header" style="width:100%">
      <kt-input
        id="palette-input"
        icon="search"
        placeholder="Search commands..."
        .value=${shellState.paletteQuery}
        @kt-input=${(e: CustomEvent<{ value: string }>) => {
          shellState.paletteQuery = e.detail.value;
          rerender();
        }}
      ></kt-input>
    </div>

    ${
      matches.length === 0
        ? html`<kt-empty-state
            compact
            icon="search"
            heading="No commands found"
            description="Try a different word."
          ></kt-empty-state>`
        : html`<ul class="palette-list">
            ${matches.map(
              (command) =>
                html`<li>
                  <a
                    class="palette-item"
                    href=${command.href}
                    @click=${() => {
                      shellState.paletteOpen = false;
                      shellState.paletteQuery = '';
                    }}
                  >
                    <kt-icon name=${command.icon} size="16"></kt-icon>
                    <span class="palette-label">${command.label}</span>
                    <span class="palette-hint">${command.hint}</span>
                  </a>
                </li>`,
            )}
          </ul>`
    }
  </kt-modal>`;
}

function sidebar(active: string): TemplateResult {
  const collapsed = shellState.collapsed;

  return html`<aside class=${classMap({ 'app-sidebar': true, collapsed })}>
    <a class="brand" href=${appHref('home')}>
      <span class="brand-mark"><kt-icon name="layers" size="18"></kt-icon></span>
      <span class="brand-copy">
        <span class="brand-name">Northwind</span>
        <span class="brand-sub">Operations console</span>
      </span>
    </a>

    <button
      class="app-search"
      @click=${() => {
        shellState.paletteOpen = true;
        rerender();
      }}
    >
      <kt-icon name="search" size="16"></kt-icon>
      <span>Search...</span>
      <kt-kbd keys="mod k"></kt-kbd>
    </button>

    <kt-sub-menu-navigation
      flush
      class="app-nav"
      label="Console"
      ?collapsed=${collapsed}
      active-href=${appHref(active)}
      .sections=${NAV}
    ></kt-sub-menu-navigation>

    <div class="app-sidebar-footer">
      ${
        collapsed
          ? nothing
          : html`<div class="storage">
              <kt-meter label="Storage" used="25.8 GB" total="of 120 GB" value="21"></kt-meter>
            </div>`
      }

      <span class="node-status">
        <span class="node-dot"></span>
        <span class="node-label">eu-west-1 · healthy</span>
      </span>

      <kt-dropdown
        preferred-placement="top"
        .options=${[
          { id: 'profile', label: 'Profile' },
          { id: 'theme', label: 'Appearance' },
          { id: 'out', label: 'Sign out' },
        ]}
      >
        <button slot="trigger" class="account">
          <kt-avatar name="Dana Whitfield" size="small" status="online"></kt-avatar>
          <span class="account-copy">
            <span class="account-name">Dana Whitfield</span>
            <span class="account-mail">dana@northwind.example</span>
          </span>
          <kt-icon name="chevrons-up-down" size="14"></kt-icon>
        </button>
      </kt-dropdown>
    </div>
  </aside>`;
}

/**
 * Wraps a console page in the application chrome.
 *
 * The page title lives in the page, not the top bar: a heading repeated in two
 * places is a heading nobody reads. The bar carries what is true everywhere —
 * search, notifications, the one action a screen always offers.
 */
export function consoleShell(
  active: string,
  body: TemplateResult,
  actions?: TemplateResult,
): TemplateResult {
  return html`<div class=${classMap({ app: true, collapsed: shellState.collapsed })}>
    ${sidebar(active)}

    <div class="app-main">
      <header class="app-topbar">
        <kt-button
          variant="secondary-no-bg"
          size="small"
          icon="panel-left"
          label=${shellState.collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          @click=${() => {
            shellState.collapsed = !shellState.collapsed;
            rerender();
          }}
        ></kt-button>

        <button
          class="topbar-search"
          @click=${() => {
            shellState.paletteOpen = true;
            rerender();
          }}
        >
          <kt-icon name="search" size="16"></kt-icon>
          <span>Search customers, files and settings...</span>
          <kt-kbd keys="mod k"></kt-kbd>
        </button>

        <div class="app-topbar-actions">
          ${actions ?? ''}
          <kt-tooltip text="Notifications">
            <span class="bell">
              <kt-button
                variant="secondary-no-bg"
                size="small"
                icon="bell"
                label="Notifications"
              ></kt-button>
              ${
                shellState.unread > 0
                  ? html`<span class="bell-count">${String(shellState.unread)}</span>`
                  : nothing
              }
            </span>
          </kt-tooltip>
        </div>
      </header>

      <div class="app-content">${body}</div>
    </div>

    ${commandPalette()}
    ${
      shellState.cookiesAccepted
        ? ''
        : html`<div class="cookie-bar">
            <kt-alert
              no-icon
              variant="neutral"
              description="We use first-party cookies to understand how the console is used."
            >
              <kt-button
                slot="actions"
                size="small"
                @click=${() => {
                  shellState.cookiesAccepted = true;
                  rerender();
                }}
                >Accept</kt-button
              >
              <kt-button
                slot="actions"
                size="small"
                variant="secondary-no-bg"
                @click=${() => {
                  shellState.cookiesAccepted = true;
                  rerender();
                }}
                >Opt out</kt-button
              >
            </kt-alert>
          </div>`
    }
  </div>`;
}
