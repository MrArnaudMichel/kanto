/** A two-pane mailbox: the list on the left, the message on the right. */
import { toaster, type KtInput, type KtModal, type KtTabs, type KtTextarea } from 'kanto-ds';
import type { Message } from '../data/api';
import { button, el, pageHeader, screen } from '../dom';
import { loadMail, updateMail } from '../mail';
import { unreadCount, visibleMail, type MailFilter } from '../views';

// Kept while the reader moves between screens, like the mail itself.
let selected: number | null = 1;
let filter: MailFilter = 'all';
let query = '';

export function inbox(outlet: HTMLElement): () => void {
  let live = true;
  let messages: Message[] = [];

  const change = (id: number, patch: Partial<Message>) => {
    messages = messages.map((message) => (message.id === id ? { ...message, ...patch } : message));
    updateMail(messages);
  };

  const search = el<KtInput>('kt-input', {
    placeholder: 'Search mail…',
    size: 'small',
    icon: 'search',
    label: 'Search mail',
  });
  search.value = query;
  search.addEventListener('kt-input', (event) => {
    query = (event as CustomEvent<{ value: string }>).detail.value;
    drawList();
  });

  const tabs = el<KtTabs>('kt-tabs', { label: 'Filter' });
  tabs.addEventListener('kt-change', (event) => {
    filter = (event as CustomEvent<{ value: MailFilter }>).detail.value;
    drawList();
  });

  // Until the mail arrives: its shape, not an empty mailbox.
  const list = el('div', { class: 'mail-scroll', 'aria-busy': 'true' }, [
    el('kt-skeleton', { variant: 'text', count: 6 }),
  ]);
  const reading = el('div', { class: 'mail-reading' });

  function drawList(): void {
    list.removeAttribute('aria-busy');
    tabs.tabs = [
      { value: 'all', label: 'All' },
      { value: 'unread', label: `Unread (${unreadCount(messages)})` },
      { value: 'starred', label: 'Starred' },
    ];
    tabs.value = filter;
    const shown = visibleMail(messages, filter, query);
    if (shown.length === 0) {
      list.replaceChildren(
        el('kt-empty-state', {
          compact: true,
          icon: 'search',
          heading: 'No messages',
          description: 'Nothing matches this filter.',
        }),
      );
      return;
    }
    list.replaceChildren(
      ...shown.map((message) => {
        const unread = message.unread ? ' unread' : '';
        const row = el(
          'button',
          {
            type: 'button',
            class: `mail-row${message.id === selected ? ' active' : ''}`,
            'aria-current': message.id === selected ? 'true' : false,
          },
          [
            el('kt-avatar', { name: message.from, size: 'small' }),
            el('span', { class: 'mail-row-body' }, [
              el('span', { class: 'mail-row-top' }, [
                el('span', { class: `mail-from${unread}` }, [message.from]),
                el('span', { class: 'mail-time' }, [message.time]),
              ]),
              el('span', { class: `mail-subject${unread}` }, [message.subject]),
              el('span', { class: 'mail-preview' }, [message.preview]),
            ]),
            ...(message.starred
              ? [el('kt-icon', { name: 'star', size: 14, label: 'Starred' })]
              : []),
          ],
        );
        row.addEventListener('click', () => {
          selected = message.id;
          change(message.id, { unread: false });
          draw();
        });
        return row;
      }),
    );
  }

  function drawReading(): void {
    const message = messages.find((candidate) => candidate.id === selected);
    if (!message || message.folder !== 'inbox') {
      reading.replaceChildren(
        el('kt-empty-state', {
          icon: 'mail',
          heading: 'Nothing selected',
          description: 'Pick a message on the left to read it.',
        }),
      );
      return;
    }
    const close = (done: string) => {
      selected = null;
      draw();
      toaster.success(done);
    };
    const reply = el<KtTextarea>('kt-textarea', {
      rows: 3,
      label: `Reply to ${message.from}`,
      placeholder: `Reply to ${message.from}…`,
    });
    reading.replaceChildren(
      el('div', { class: 'mail-reading-head' }, [
        el('div', { class: 'row' }, [
          el('kt-avatar', { name: message.from }),
          el('div', { class: 'stack mail-title' }, [
            el('strong', {}, [message.subject]),
            el('span', { class: 'muted small' }, [`${message.from} · ${message.time}`]),
          ]),
        ]),
        el('div', { class: 'row' }, [
          el('kt-tooltip', { text: message.starred ? 'Remove the star' : 'Star' }, [
            button(
              '',
              {
                variant: 'secondary-no-bg',
                size: 'small',
                icon: 'star',
                label: message.starred ? 'Remove the star' : 'Star',
              },
              () => {
                change(message.id, { starred: !message.starred });
                draw();
              },
            ),
          ]),
          button(
            '',
            { variant: 'secondary-no-bg', size: 'small', icon: 'archive', label: 'Archive' },
            () => {
              change(message.id, { folder: 'archive' });
              close('Message archived');
            },
          ),
          button(
            '',
            { variant: 'secondary-no-bg', size: 'small', icon: 'trash-2', label: 'Delete' },
            () => {
              messages = messages.filter((candidate) => candidate.id !== message.id);
              updateMail(messages);
              close('Message deleted');
            },
          ),
        ]),
      ]),
      el(
        'div',
        { class: 'mail-body' },
        message.body.map((paragraph) => el('p', {}, [paragraph])),
      ),
      el('div', { class: 'mail-reply' }, [
        reply,
        el('div', { class: 'row end' }, [
          button('Send', { icon: 'send' }, () => {
            if (!reply.value.trim()) {
              reply.error = 'Write a reply first.';
              return;
            }
            reply.error = '';
            reply.value = '';
            toaster.success('Reply sent', { description: `To ${message.from}.` });
          }),
        ]),
      ]),
    );
  }

  function draw(): void {
    drawList();
    drawReading();
  }

  // Composing: a dialog that checks its address before it sends.
  const to = el<KtInput>('kt-input', { type: 'email', placeholder: 'someone@example.com' });
  const subject = el<KtInput>('kt-input');
  const body = el<KtTextarea>('kt-textarea', { rows: 6 });
  const compose = el<KtModal>(
    'kt-modal',
    { heading: 'New message', description: 'This will be sent from your workspace address.' },
    [
      el('div', { class: 'stack' }, [
        el('kt-label-input', { label: 'To', required: true }, [to]),
        el('kt-label-input', { label: 'Subject' }, [subject]),
        el('kt-label-input', { label: 'Message' }, [body]),
      ]),
      button('Cancel', { slot: 'footer', variant: 'dark' }, () => {
        compose.open = false;
      }),
      button('Send', { slot: 'footer', icon: 'send' }, () => {
        if (!/^\S+@\S+\.\S+$/.test(to.value.trim())) {
          to.error = 'Enter an address like someone@example.com.';
          return;
        }
        compose.open = false;
        toaster.success('Message sent', { description: `To ${to.value.trim()}.` });
        for (const field of [to, subject, body]) field.value = '';
      }),
    ],
  );
  compose.addEventListener('kt-close', () => {
    to.error = '';
  });

  outlet.append(
    screen('inbox', [
      pageHeader('Workspace', 'Inbox', 'Everything addressed to the workspace, in one list.', [
        button('Compose', { variant: 'dark', icon: 'pencil' }, () => {
          compose.open = true;
        }),
      ]),
      el('div', { class: 'mail' }, [
        el('div', { class: 'mail-list' }, [
          el('div', { class: 'mail-list-head' }, [search, tabs]),
          list,
        ]),
        reading,
      ]),
      compose,
    ]),
  );

  void loadMail().then((loaded) => {
    if (!live) return;
    messages = [...loaded];
    draw();
  });
  return () => {
    live = false;
  };
}
