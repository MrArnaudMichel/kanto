import { html, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { rerender } from '../lib/render.js';

/**
 * The console's own chrome.
 *
 * This is the point of the whole exercise: a real application shell, built only
 * from Kanto elements, that the component pages can be judged against. A
 * gallery shows that a button exists; this shows what happens when thirty of
 * them have to share a screen.
 */

export interface NavItem {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
  readonly badge?: string;
  readonly children?: readonly { slug: string; label: string }[];
}

export const NAV: readonly NavItem[] = [
  { slug: 'home', label: 'Home', icon: 'house' },
  { slug: 'inbox', label: 'Inbox', icon: 'inbox', badge: '4' },
  { slug: 'customers', label: 'Customers', icon: 'users' },
  {
    slug: 'settings',
    label: 'Settings',
    icon: 'settings',
    children: [
      { slug: 'general', label: 'General' },
      { slug: 'members', label: 'Members' },
      { slug: 'notifications', label: 'Notifications' },
      { slug: 'security', label: 'Security' },
    ],
  },
];

interface ShellState {
  collapsed: boolean;
  settingsOpen: boolean;
  paletteOpen: boolean;
  paletteQuery: string;
  cookiesAccepted: boolean;
  unread: number;
}

export const shellState: ShellState = {
  collapsed: false,
  settingsOpen: true,
  paletteOpen: false,
  paletteQuery: '',
  cookiesAccepted: false,
  unread: 4,
};

export const appHref = (path: string) => `#/app/console/${path}`;

/** Everything the palette can jump to. */
const COMMANDS = [
  { label: 'Home', hint: 'Go to', icon: 'house', href: appHref('home') },
  { label: 'Inbox', hint: 'Go to', icon: 'inbox', href: appHref('inbox') },
  { label: 'Customers', hint: 'Go to', icon: 'users', href: appHref('customers') },
  { label: 'General settings', hint: 'Go to', icon: 'settings', href: appHref('settings/general') },
  { label: 'Members', hint: 'Go to', icon: 'users', href: appHref('settings/members') },
  { label: 'Notifications', hint: 'Go to', icon: 'bell', href: appHref('settings/notifications') },
  { label: 'Security', hint: 'Go to', icon: 'shield', href: appHref('settings/security') },
  {
    label: 'Back to the documentation',
    hint: 'Leave',
    icon: 'book-open',
    href: '#/guide/introduction',
  },
];

function commandPalette(): TemplateResult {
  const needle = shellState.paletteQuery.trim().toLowerCase();
  const matches = needle
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(needle))
    : COMMANDS;

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
  const isActive = (slug: string) => active === slug || active.startsWith(`${slug}/`);

  return html`<aside class=${classMap({ 'app-sidebar': true, collapsed: shellState.collapsed })}>
    <kt-dropdown
      .options=${[
        { id: 'kanto-ds', label: 'Kanto Studio' },
        { id: 'acme', label: 'Acme Corp' },
        { id: 'new', label: '+ New workspace' },
      ]}
      .value=${'kanto-ds'}
    >
      <button slot="trigger" class="workspace">
        <kt-avatar name="Kanto Studio" square size="small"></kt-avatar>
        <span class="workspace-name">Kanto Studio</span>
        <kt-icon name="chevrons-up-down" size="14"></kt-icon>
      </button>
    </kt-dropdown>

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

    <nav class="app-nav" aria-label="Console">
      ${NAV.map((item) =>
        item.children
          ? html`<div>
              <button
                class=${classMap({ 'app-nav-item': true, active: isActive(item.slug) })}
                aria-expanded=${shellState.settingsOpen ? 'true' : 'false'}
                @click=${() => {
                  shellState.settingsOpen = !shellState.settingsOpen;
                  rerender();
                }}
              >
                <kt-icon name=${item.icon} size="16"></kt-icon>
                <span class="app-nav-label">${item.label}</span>
                <kt-icon
                  name=${shellState.settingsOpen ? 'chevron-up' : 'chevron-down'}
                  size="14"
                ></kt-icon>
              </button>
              ${
                shellState.settingsOpen
                  ? html`<div class="app-subnav">
                      ${item.children.map(
                        (child) =>
                          html`<a
                            class=${classMap({
                              'app-nav-item': true,
                              sub: true,
                              active: active === `${item.slug}/${child.slug}`,
                            })}
                            href=${appHref(`${item.slug}/${child.slug}`)}
                            >${child.label}</a
                          >`,
                      )}
                    </div>`
                  : ''
              }
            </div>`
          : html`<a
              class=${classMap({ 'app-nav-item': true, active: isActive(item.slug) })}
              href=${appHref(item.slug)}
              aria-current=${isActive(item.slug) ? 'page' : undefined}
            >
              <kt-icon name=${item.icon} size="16"></kt-icon>
              <span class="app-nav-label">${item.label}</span>
              ${
                item.slug === 'inbox' && shellState.unread > 0
                  ? html`<kt-badge pill>${String(shellState.unread)}</kt-badge>`
                  : ''
              }
            </a>`,
      )}
    </nav>

    <div class="app-sidebar-footer">
      <a class="app-nav-item" href="#/guide/introduction">
        <kt-icon name="message-circle" size="16"></kt-icon>
        <span class="app-nav-label">Feedback</span>
      </a>
      <a class="app-nav-item" href="#/guide/introduction">
        <kt-icon name="circle-help" size="16"></kt-icon>
        <span class="app-nav-label">Help &amp; Support</span>
      </a>

      <kt-dropdown
        preferred-placement="top"
        .options=${[
          { id: 'profile', label: 'Profile' },
          { id: 'theme', label: 'Appearance' },
          { id: 'out', label: 'Sign out' },
        ]}
      >
        <button slot="trigger" class="workspace">
          <kt-avatar name="Arnaud Michel" size="small" status="online"></kt-avatar>
          <span class="workspace-name">Arnaud Michel</span>
          <kt-icon name="chevrons-up-down" size="14"></kt-icon>
        </button>
      </kt-dropdown>
    </div>
  </aside>`;
}

/** Wraps a console page in the application chrome. */
export function consoleShell(
  active: string,
  title: string,
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
        <h1>${title}</h1>

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
              ${shellState.unread > 0 ? html`<span class="bell-dot"></span>` : ''}
            </span>
          </kt-tooltip>
          <kt-button size="small" icon="plus" label="New"></kt-button>
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
