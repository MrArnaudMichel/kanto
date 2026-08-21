import { html, type TemplateResult } from 'lit';
import { rerender } from '../lib/render.js';

/**
 * A conversational assistant.
 *
 * A third shape again: a scrolling transcript, a growing composer, streaming
 * text, and a list of past conversations. The interesting part for a design
 * system is the waiting — a skeleton that reads as thinking rather than as
 * broken, and a composer that stays usable while it happens.
 */

interface Turn {
  readonly id: number;
  readonly role: 'you' | 'assistant';
  readonly text: string;
}

interface Thread {
  readonly id: number;
  readonly title: string;
  readonly when: string;
}

const THREADS: Thread[] = [
  { id: 1, title: 'Why is revenue down 3%?', when: 'Today' },
  { id: 2, title: 'Draft the Q3 summary', when: 'Today' },
  { id: 3, title: 'Which regions are growing?', when: 'Yesterday' },
  { id: 4, title: 'Explain the churn spike', when: 'Mon' },
];

/** Canned answers — the point is the interface, not a language model. */
const REPLIES: Record<string, string> = {
  default:
    'Revenue fell 3% while orders rose 2%, so the average basket shrank rather than demand. The discount codes issued in August are the first place I would look.',
  regions:
    'North East is up 11% and Midlands up 4%. South West is flat and North West is down 6%, which is most of the shortfall on its own.',
  churn:
    'Churn moved from 1.8% to 2.1%, and almost all of it sits in accounts under six months old. That usually points at onboarding rather than at price.',
};

const state = {
  thread: 1,
  turns: [
    { id: 1, role: 'you', text: 'Why is revenue down 3% this month?' },
    { id: 2, role: 'assistant', text: REPLIES['default']! },
  ] as Turn[],
  draft: '',
  thinking: false,
};

const SUGGESTIONS = [
  'Which regions are growing?',
  'Explain the churn spike',
  'Draft a summary for the board',
];

function answerFor(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('region')) return REPLIES['regions']!;
  if (q.includes('churn')) return REPLIES['churn']!;
  return REPLIES['default']!;
}

function send(text: string): void {
  const question = text.trim();
  if (!question || state.thinking) return;

  state.turns = [...state.turns, { id: Date.now(), role: 'you', text: question }];
  state.draft = '';
  state.thinking = true;
  rerender();

  // Streamed a word at a time, so the waiting state is the real one rather
  // than a spinner standing in for it.
  const answer = answerFor(question);
  const words = answer.split(' ');
  const id = Date.now() + 1;
  let shown = 0;

  setTimeout(() => {
    state.turns = [...state.turns, { id, role: 'assistant', text: '' }];
    state.thinking = false;

    const timer = setInterval(() => {
      shown += 2;
      const text = words.slice(0, shown).join(' ');
      state.turns = state.turns.map((turn) => (turn.id === id ? { ...turn, text } : turn));
      rerender();
      if (shown >= words.length) clearInterval(timer);
    }, 45);
  }, 700);
}

export function chatPage(): TemplateResult {
  return html`<div class="chat">
    <aside class="chat-threads">
      <kt-button
        full-width
        icon="plus"
        @click=${() => {
          state.turns = [];
          rerender();
        }}
        >New conversation</kt-button
      >

      <nav class="chat-thread-list" aria-label="Conversations">
        ${THREADS.map(
          (thread) =>
            html`<button
              class="chat-thread ${thread.id === state.thread ? 'active' : ''}"
              @click=${() => {
                state.thread = thread.id;
                rerender();
              }}
            >
              <kt-icon name="message-circle" size="14"></kt-icon>
              <span class="chat-thread-title">${thread.title}</span>
              <span class="chat-thread-when">${thread.when}</span>
            </button>`,
        )}
      </nav>

      <div class="chat-threads-footer">
        <a class="app-nav-item" href="#/app/console/home">
          <kt-icon name="panel-left" size="16"></kt-icon>
          <span class="app-nav-label">Back to the console</span>
        </a>
      </div>
    </aside>

    <div class="chat-main">
      <header class="chat-head">
        <div class="row" style="gap:10px">
          <kt-avatar name="Kanto Assistant" square></kt-avatar>
          <div class="stack" style="gap:0">
            <strong>Assistant</strong>
            <span class="muted" style="font:var(--font-normal-small)"
              >Answers from your workspace data</span
            >
          </div>
        </div>
        <kt-badge variant="info">Demo</kt-badge>
      </header>

      <div class="chat-transcript">
        ${
          state.turns.length === 0
            ? html`<kt-empty-state
                icon="message-circle"
                heading="Ask about your workspace"
                description="Revenue, churn, regions — anything on the dashboard."
              >
                <div slot="actions" class="row" style="justify-content:center">
                  ${SUGGESTIONS.map(
                    (suggestion) =>
                      html`<kt-chip clickable @kt-chip-click=${() => send(suggestion)}
                        >${suggestion}</kt-chip
                      >`,
                  )}
                </div>
              </kt-empty-state>`
            : state.turns.map(
                (turn) =>
                  html`<div class="chat-turn ${turn.role}">
                    ${
                      turn.role === 'assistant'
                        ? html`<kt-avatar name="Kanto Assistant" square size="small"></kt-avatar>`
                        : html`<kt-avatar name="Arnaud Michel" size="small"></kt-avatar>`
                    }
                    <div class="chat-bubble">${turn.text}</div>
                  </div>`,
              )
        }
        ${
          state.thinking
            ? html`<div class="chat-turn assistant">
                <kt-avatar name="Kanto Assistant" square size="small"></kt-avatar>
                <div class="chat-bubble thinking">
                  <kt-skeleton count="2"></kt-skeleton>
                </div>
              </div>`
            : ''
        }
      </div>

      ${
        state.turns.length > 0
          ? html`<div class="chat-suggestions">
              ${SUGGESTIONS.map(
                (suggestion) =>
                  html`<kt-chip clickable @kt-chip-click=${() => send(suggestion)}
                    >${suggestion}</kt-chip
                  >`,
              )}
            </div>`
          : ''
      }

      <form
        class="chat-composer"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          send(state.draft);
        }}
      >
        <kt-textarea
          rows="1"
          resize="none"
          placeholder="Ask a question..."
          .value=${state.draft}
          @kt-input=${(e: CustomEvent<{ value: string }>) => {
            state.draft = e.detail.value;
          }}
        ></kt-textarea>
        <kt-button type="submit" icon="send" label="Send" ?disabled=${state.thinking}></kt-button>
      </form>
      <span class="chat-note muted">
        Canned answers — the interface is the point, not a language model.
      </span>
    </div>
  </div>`;
}
