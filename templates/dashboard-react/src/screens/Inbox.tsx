/** A two-pane mailbox: the list on the left, the message on the right. */
import { useRef, useState } from 'react';
import { toaster, type KtInput, type KtTextarea } from 'kanto-ds';
import type { Message } from '../data/api';
import { setMail, useMail } from '../mail';
import { Screen, useKept } from '../parts';
import { unreadCount, visibleMail, type MailFilter } from '../views';

function Reading({
  message,
  onChange,
  onClose,
}: {
  message: Message;
  onChange: (patch: Partial<Message> | null) => void;
  onClose: (done: string) => void;
}) {
  const reply = useRef<KtTextarea>(null);
  const [error, setError] = useState('');
  const star = message.starred ? 'Remove the star' : 'Star';
  return (
    <>
      <div className="mail-reading-head">
        <div className="row">
          <kt-avatar name={message.from} />
          <div className="stack mail-title">
            <strong>{message.subject}</strong>
            <span className="muted small">{`${message.from} · ${message.time}`}</span>
          </div>
        </div>
        <div className="row">
          <kt-tooltip text={star}>
            <kt-button
              variant="secondary-no-bg"
              size="small"
              icon="star"
              label={star}
              onClick={() => onChange({ starred: !message.starred })}
            />
          </kt-tooltip>
          <kt-button
            variant="secondary-no-bg"
            size="small"
            icon="archive"
            label="Archive"
            onClick={() => {
              onChange({ folder: 'archive' });
              onClose('Message archived');
            }}
          />
          <kt-button
            variant="secondary-no-bg"
            size="small"
            icon="trash-2"
            label="Delete"
            onClick={() => {
              onChange(null);
              onClose('Message deleted');
            }}
          />
        </div>
      </div>
      <div className="mail-body">
        {message.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mail-reply">
        <kt-textarea
          ref={reply}
          rows={3}
          label={`Reply to ${message.from}`}
          placeholder={`Reply to ${message.from}…`}
          error={error}
        />
        <div className="row end">
          <kt-button
            icon="send"
            onClick={() => {
              const field = reply.current;
              if (!field?.value.trim()) {
                setError('Write a reply first.');
                return;
              }
              setError('');
              field.value = '';
              toaster.success('Reply sent', { description: `To ${message.from}.` });
            }}
          >
            Send
          </kt-button>
        </div>
      </div>
    </>
  );
}

function Compose({ open, onClose }: { open: boolean; onClose: () => void }) {
  const to = useRef<KtInput>(null);
  const subject = useRef<KtInput>(null);
  const body = useRef<KtTextarea>(null);
  const [error, setError] = useState('');
  return (
    <kt-modal
      open={open}
      heading="New message"
      description="This will be sent from your workspace address."
      onkt-close={() => {
        setError('');
        onClose();
      }}
    >
      <div className="stack">
        <kt-label-input label="To" required>
          <kt-input ref={to} type="email" placeholder="someone@example.com" error={error} />
        </kt-label-input>
        <kt-label-input label="Subject">
          <kt-input ref={subject} />
        </kt-label-input>
        <kt-label-input label="Message">
          <kt-textarea ref={body} rows={6} />
        </kt-label-input>
      </div>
      <kt-button slot="footer" variant="dark" onClick={onClose}>
        Cancel
      </kt-button>
      <kt-button
        slot="footer"
        icon="send"
        onClick={() => {
          const address = to.current?.value.trim() ?? '';
          if (!/^\S+@\S+\.\S+$/.test(address)) {
            setError('Enter an address like someone@example.com.');
            return;
          }
          setError('');
          onClose();
          toaster.success('Message sent', { description: `To ${address}.` });
          for (const field of [to.current, subject.current, body.current]) {
            if (field) field.value = '';
          }
        }}
      >
        Send
      </kt-button>
    </kt-modal>
  );
}

// Kept while the reader moves between screens, like the mail itself.
const kept = { selected: 1 as number | null, filter: 'all' as MailFilter, query: '' };

export function Inbox() {
  const mail = useMail();
  const messages = mail ?? [];
  const [selected, setSelected] = useKept(kept, 'selected');
  const [filter, setFilter] = useKept(kept, 'filter');
  const [query, setQuery] = useKept(kept, 'query');
  const [composing, setComposing] = useState(false);

  const shown = visibleMail(messages, filter, query);
  const message = messages.find((candidate) => candidate.id === selected);

  const change = (id: number, patch: Partial<Message> | null) =>
    setMail(
      patch === null
        ? messages.filter((candidate) => candidate.id !== id)
        : messages.map((candidate) =>
            candidate.id === id ? { ...candidate, ...patch } : candidate,
          ),
    );

  return (
    <Screen name="inbox">
      <kt-page-header
        eyebrow="Workspace"
        heading="Inbox"
        description="Everything addressed to the workspace, in one list."
      >
        <kt-button slot="actions" variant="dark" icon="pencil" onClick={() => setComposing(true)}>
          Compose
        </kt-button>
      </kt-page-header>

      <div className="mail">
        <div className="mail-list">
          <div className="mail-list-head">
            <kt-input
              placeholder="Search mail…"
              size="small"
              icon="search"
              label="Search mail"
              value={query}
              onkt-input={(event) => setQuery(event.detail.value)}
            />
            <kt-tabs
              label="Filter"
              value={filter}
              tabs={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: `Unread (${unreadCount(messages)})` },
                { value: 'starred', label: 'Starred' },
              ]}
              onkt-change={(event) => setFilter(event.detail.value as MailFilter)}
            />
          </div>
          <div className="mail-scroll" aria-busy={mail === null}>
            {mail === null ? (
              // Until the mail arrives: its shape, not an empty mailbox.
              <kt-skeleton variant="text" count={6} />
            ) : shown.length === 0 ? (
              <kt-empty-state
                compact
                icon="search"
                heading="No messages"
                description="Nothing matches this filter."
              />
            ) : (
              shown.map((item) => {
                const unread = item.unread ? ' unread' : '';
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`mail-row${item.id === selected ? ' active' : ''}`}
                    aria-current={item.id === selected ? 'true' : undefined}
                    onClick={() => {
                      setSelected(item.id);
                      change(item.id, { unread: false });
                    }}
                  >
                    <kt-avatar name={item.from} size="small" />
                    <span className="mail-row-body">
                      <span className="mail-row-top">
                        <span className={`mail-from${unread}`}>{item.from}</span>
                        <span className="mail-time">{item.time}</span>
                      </span>
                      <span className={`mail-subject${unread}`}>{item.subject}</span>
                      <span className="mail-preview">{item.preview}</span>
                    </span>
                    {item.starred ? <kt-icon name="star" size={14} label="Starred" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mail-reading">
          {mail === null ? null : message && message.folder === 'inbox' ? (
            <Reading
              key={message.id}
              message={message}
              onChange={(patch) => change(message.id, patch)}
              onClose={(done) => {
                setSelected(null);
                toaster.success(done);
              }}
            />
          ) : (
            <kt-empty-state
              icon="mail"
              heading="Nothing selected"
              description="Pick a message on the left to read it."
            />
          )}
        </div>
      </div>

      <Compose open={composing} onClose={() => setComposing(false)} />
    </Screen>
  );
}
