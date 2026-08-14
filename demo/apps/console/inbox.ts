import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';
import { rerender } from '../../lib/render.js';
import { consoleShell, shellState } from '../shell.js';

/**
 * A two-pane mailbox: list on the left, the message on the right.
 *
 * The pattern is worth showing because it is where a component set usually
 * cracks — a scrolling list, a selected row, an empty state, a reply box and a
 * toolbar all sharing one screen.
 */

interface Message {
  id: number;
  from: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  starred: boolean;
  folder: 'inbox' | 'archive';
}

const MESSAGES: Message[] = [
  {
    id: 1,
    from: 'Emma Davis',
    subject: 'Refund for order #4599',
    preview: 'The customer says the second charge was never authorised…',
    body: [
      'The customer says the second charge was never authorised, and the timestamps back that up — both attempts land inside the same minute.',
      'I have refunded the duplicate and left the original. Nothing else to do unless they come back.',
    ],
    time: '06:24',
    unread: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 2,
    from: 'Frank Nguyen',
    subject: 'Q3 numbers are in',
    preview: 'Revenue is down 3% but orders are up — average basket fell…',
    body: [
      'Revenue is down 3% while orders are up 2%, so the average basket fell rather than demand.',
      'Worth looking at the discount codes before we read anything else into it.',
    ],
    time: '05:41',
    unread: true,
    starred: true,
    folder: 'inbox',
  },
  {
    id: 3,
    from: 'Chloe Bertin',
    subject: 'Design review — console shell',
    preview: 'Two notes on the sidebar and one on the empty states…',
    body: [
      'Two notes on the sidebar: the collapsed width should keep the icons centred, and the workspace switcher wants a divider under it.',
      'The empty states read well. The one in the mailbox is the best of them.',
    ],
    time: 'Yesterday',
    unread: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 4,
    from: 'Hana Okafor',
    subject: 'Storage quota',
    preview: 'We are at 88% and climbing about a point a week…',
    body: ['We are at 88% and climbing roughly a point a week. Two months of runway.'],
    time: 'Yesterday',
    unread: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 5,
    from: 'Marco Rossi',
    subject: 'Welcome to Kanto',
    preview: 'Everything you need to get started with the console…',
    body: ['Everything you need to get started is in the guide. Shout if anything is unclear.'],
    time: 'Mon',
    unread: false,
    starred: false,
    folder: 'inbox',
  },
];

const state = {
  messages: MESSAGES.map((m) => ({ ...m })),
  selected: 1 as number | null,
  filter: 'all' as 'all' | 'unread' | 'starred',
  query: '',
  composing: false,
};

const syncUnread = () => {
  shellState.unread = state.messages.filter((m) => m.unread && m.folder === 'inbox').length;
};

function visible(): Message[] {
  const needle = state.query.trim().toLowerCase();

  return state.messages.filter((m) => {
    if (m.folder !== 'inbox') return false;
    if (state.filter === 'unread' && !m.unread) return false;
    if (state.filter === 'starred' && !m.starred) return false;
    if (!needle) return true;
    return `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(needle);
  });
}

function open(message: Message): void {
  message.unread = false;
  state.selected = message.id;
  syncUnread();
  rerender();
}

export function consoleInbox(): TemplateResult {
  const list = visible();
  const message = state.messages.find((m) => m.id === state.selected) ?? null;

  const body = html`<div class="mail">
    <div class="mail-list">
      <div class="mail-list-head">
        <kt-input
          placeholder="Search mail..."
          size="small"
          .value=${state.query}
          @kt-input=${(e: CustomEvent<{ value: string }>) => {
            state.query = e.detail.value;
            rerender();
          }}
        ></kt-input>
        <kt-tabs
          label="Filter"
          .value=${state.filter}
          .tabs=${[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread (${state.messages.filter((m) => m.unread).length})` },
            { value: 'starred', label: 'Starred' },
          ]}
          @kt-change=${(e: CustomEvent<{ value: typeof state.filter }>) => {
            state.filter = e.detail.value;
            rerender();
          }}
        ></kt-tabs>
      </div>

      <div class="mail-scroll">
        ${
          list.length === 0
            ? html`<kt-empty-state
                compact
                icon="search"
                heading="No messages"
                description="Nothing matches this filter."
              ></kt-empty-state>`
            : list.map(
                (m) =>
                  html`<button
                    class="mail-row ${m.id === state.selected ? 'active' : ''}"
                    @click=${() => open(m)}
                  >
                    <kt-avatar name=${m.from} size="small"></kt-avatar>
                    <span class="mail-row-body">
                      <span class="mail-row-top">
                        <span class="mail-from ${m.unread ? 'unread' : ''}">${m.from}</span>
                        <span class="mail-time">${m.time}</span>
                      </span>
                      <span class="mail-subject ${m.unread ? 'unread' : ''}">${m.subject}</span>
                      <span class="mail-preview">${m.preview}</span>
                    </span>
                    ${m.starred ? html`<kt-icon name="star" size="14"></kt-icon>` : ''}
                  </button>`,
              )
        }
      </div>
    </div>

    <div class="mail-reading">
      ${
        message
          ? html`
              <div class="mail-reading-head">
                <div class="row" style="gap:12px;flex-wrap:nowrap">
                  <kt-avatar name=${message.from}></kt-avatar>
                  <div class="stack" style="gap:2px;min-width:0">
                    <strong>${message.subject}</strong>
                    <span class="muted" style="font:var(--font-normal-small)"
                      >${message.from} · ${message.time}</span
                    >
                  </div>
                </div>
                <div class="row">
                  <kt-tooltip text=${message.starred ? 'Remove star' : 'Star'}>
                    <kt-button
                      variant="secondary-no-bg"
                      size="small"
                      icon="star"
                      label="Star"
                      @click=${() => {
                        message.starred = !message.starred;
                        rerender();
                      }}
                    ></kt-button>
                  </kt-tooltip>
                  <kt-button
                    variant="secondary-no-bg"
                    size="small"
                    icon="archive"
                    label="Archive"
                    @click=${() => {
                      message.folder = 'archive';
                      state.selected = null;
                      syncUnread();
                      rerender();
                      toaster.success('Message archived');
                    }}
                  ></kt-button>
                  <kt-button
                    variant="secondary-no-bg"
                    size="small"
                    icon="trash-2"
                    label="Delete"
                    @click=${() => {
                      state.messages = state.messages.filter((m) => m.id !== message.id);
                      state.selected = null;
                      syncUnread();
                      rerender();
                      toaster.success('Message deleted');
                    }}
                  ></kt-button>
                </div>
              </div>

              <div class="mail-body">
                ${message.body.map((paragraph) => html`<p>${paragraph}</p>`)}
              </div>

              <div class="mail-reply">
                <kt-textarea rows="3" placeholder=${`Reply to ${message.from}...`}></kt-textarea>
                <div class="row" style="justify-content:flex-end">
                  <kt-button
                    icon="send"
                    @click=${() => toaster.success('Reply sent', { description: `To ${message.from}.` })}
                    >Send</kt-button
                  >
                </div>
              </div>
            `
          : html`<kt-empty-state
              icon="mail"
              heading="Nothing selected"
              description="Pick a message on the left to read it."
            ></kt-empty-state>`
      }
    </div>
  </div>`;

  const actions = html`<kt-button
    size="small"
    variant="dark"
    icon="pencil"
    @click=${() => {
      state.composing = true;
      rerender();
    }}
    >Compose</kt-button
  >`;

  return consoleShell(
    'inbox',
    'Inbox',
    html`${body}
      <kt-modal
        ?open=${state.composing}
        heading="New message"
        description="This will be sent from your workspace address."
        @kt-close=${() => {
          state.composing = false;
          rerender();
        }}
      >
        <div class="stack">
          <kt-label-input label="To" required>
            <kt-input type="email" placeholder="someone@example.com"></kt-input>
          </kt-label-input>
          <kt-label-input label="Subject">
            <kt-input></kt-input>
          </kt-label-input>
          <kt-label-input label="Message">
            <kt-textarea rows="6"></kt-textarea>
          </kt-label-input>
        </div>
        <kt-button
          slot="footer"
          variant="dark"
          @click=${() => {
            state.composing = false;
            rerender();
          }}
          >Cancel</kt-button
        >
        <kt-button
          slot="footer"
          icon="send"
          @click=${() => {
            state.composing = false;
            rerender();
            toaster.success('Message sent');
          }}
          >Send</kt-button
        >
      </kt-modal>`,
    actions,
  );
}
