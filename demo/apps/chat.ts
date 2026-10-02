import { html, nothing, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { toaster } from 'kanto-ds';
import { rerender } from '../lib/render.js';

/**
 * An assistant workspace.
 *
 * The interesting part for a design system is not the bubbles. It is
 * everything an answer drags in with it: the tool calls that produced it, the
 * sources it leaned on, the moment it is still arriving, and a composer that
 * stays usable throughout. Those are the parts that get skipped in a mockup and
 * then have nowhere to live.
 */

/* ------------------------------------------------------------------- model */

interface Source {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly snippet: string;
}

interface ToolCall {
  readonly name: string;
  readonly args: string;
  readonly result: string;
  readonly rows?: number;
}

interface Turn {
  id: number;
  role: 'you' | 'assistant';
  text: string;
  /** Only the tail of an assistant turn is still arriving. */
  streaming?: boolean;
  tools?: readonly ToolCall[];
  sources?: readonly Source[];
  chart?: { labels: string[]; values: number[] };
  rating?: 'up' | 'down' | undefined;
}

interface Thread {
  readonly id: number;
  readonly title: string;
  readonly group: string;
  readonly space: string;
}

const THREADS: readonly Thread[] = [
  { id: 1, title: 'Why is revenue down 3%?', group: 'Today', space: 'Revenue' },
  { id: 2, title: 'Draft the Q3 board summary', group: 'Today', space: 'Revenue' },
  { id: 3, title: 'Which regions are growing?', group: 'Yesterday', space: 'Revenue' },
  { id: 4, title: 'Explain the churn spike', group: 'Yesterday', space: 'Retention' },
  { id: 5, title: 'Onboarding drop-off by step', group: 'Last week', space: 'Retention' },
  { id: 6, title: 'Rewrite the dunning emails', group: 'Last week', space: 'Billing' },
];

const SOURCES: Record<string, Source> = {
  ledger: {
    id: 'ledger',
    title: 'revenue_by_month',
    kind: 'Table · Postgres',
    snippet: '30 rows, Aug 12 – Sep 10. Gross of refunds, excluding test accounts.',
  },
  discounts: {
    id: 'discounts',
    title: 'August discount campaign',
    kind: 'Document',
    snippet: 'Blanket 15% code issued to 4,100 accounts, live 3–24 August.',
  },
  churn: {
    id: 'churn',
    title: 'cohort_retention',
    kind: 'Table · Postgres',
    snippet: 'Monthly cohorts since 2024, retention at 30/60/90 days.',
  },
  regions: {
    id: 'regions',
    title: 'orders_by_region',
    kind: 'Table · Postgres',
    snippet: 'Four regions, weekly grain, last two quarters.',
  },
};

/** Canned answers — the point is the interface, not a language model. */
interface Answer {
  readonly text: string;
  readonly tools: readonly ToolCall[];
  readonly sources: readonly Source[];
  readonly chart?: { labels: string[]; values: number[] };
}

const ANSWERS: Record<string, Answer> = {
  revenue: {
    text: 'Revenue fell 3% while orders rose 2%, so the average basket shrank rather than demand. The August discount code is the whole of it: baskets that used it are 19% smaller, and they were 38% of orders in the window. Strip them out and revenue is up 1.4%.\n\nWorth deciding before the next campaign whether a blanket code is the right instrument here.',
    tools: [
      {
        name: 'query_warehouse',
        args: '{ "table": "revenue_by_month", "from": "2026-08-12", "to": "2026-09-10" }',
        result: '30 rows · sum 292,342 · mean 9,744',
        rows: 30,
      },
      {
        name: 'search_documents',
        args: '{ "q": "discount campaign august" }',
        result: '2 documents, best match “August discount campaign”',
      },
    ],
    sources: [SOURCES['ledger']!, SOURCES['discounts']!],
    chart: {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
      values: [72, 61, 58, 55, 69],
    },
  },
  regions: {
    text: 'North East is up 11% and Midlands up 4%. South West is flat. North West is down 6%, which is most of the shortfall on its own — and all of that fall sits in accounts that joined before March.',
    tools: [
      {
        name: 'query_warehouse',
        args: '{ "table": "orders_by_region", "grain": "week" }',
        result: '4 regions × 13 weeks = 52 rows',
        rows: 52,
      },
    ],
    sources: [SOURCES['regions']!],
    chart: {
      labels: ['North East', 'Midlands', 'South West', 'North West'],
      values: [111, 104, 100, 94],
    },
  },
  churn: {
    text: 'Churn moved from 1.8% to 2.1%. Almost all of it is accounts under six months old, and within those it clusters at day 34 — a day after the trial-to-paid email goes out.\n\nThat usually points at onboarding rather than at price. I would read the day-30 to day-40 sessions before changing anything about the plan.',
    tools: [
      {
        name: 'query_warehouse',
        args: '{ "table": "cohort_retention", "cohorts": 18 }',
        result: '18 cohorts · churn 1.8% → 2.1%',
        rows: 18,
      },
    ],
    sources: [SOURCES['churn']!],
  },
  default: {
    text: 'I can only answer from this workspace, and this one is a demonstration — the data behind it is generated. Try one of the suggestions: they run the same path a real answer would, tool calls and sources included.',
    tools: [],
    sources: [],
  },
};

const MODELS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'precise', label: 'Precise' },
  { id: 'fast', label: 'Fast' },
];

const SUGGESTIONS = [
  { icon: 'trending-down', text: 'Why is revenue down 3% this month?' },
  { icon: 'map', text: 'Which regions are growing?' },
  { icon: 'user-minus', text: 'Explain the churn spike' },
  { icon: 'file-text', text: 'Draft a summary for the board' },
];

/* ------------------------------------------------------------------- state */

interface ChatState {
  thread: number;
  turns: Turn[];
  draft: string;
  model: string;
  streaming: boolean;
  attachments: string[];
  sourcesOpen: boolean;
  railCollapsed: boolean;
  nextId: number;
}

const state: ChatState = {
  thread: 1,
  turns: [],
  draft: '',
  model: 'balanced',
  streaming: false,
  attachments: [],
  sourcesOpen: true,
  railCollapsed: false,
  nextId: 1,
};

let timer: ReturnType<typeof setInterval> | null = null;

function answerFor(question: string): Answer {
  const q = question.toLowerCase();
  if (q.includes('region') || q.includes('growing')) return ANSWERS['regions']!;
  if (q.includes('churn') || q.includes('retention')) return ANSWERS['churn']!;
  if (q.includes('revenue') || q.includes('down') || q.includes('board')) {
    return ANSWERS['revenue']!;
  }
  return ANSWERS['default']!;
}

/** Keeps the transcript pinned to the newest turn while an answer arrives. */
function stickToBottom(): void {
  requestAnimationFrame(() => {
    const scroller = document.querySelector<HTMLElement>('.chat-transcript');
    if (!scroller) return;
    // Only follow if the reader is already near the end — yanking them back
    // from something they scrolled up to read is the worst thing this can do.
    const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distance < 220) scroller.scrollTop = scroller.scrollHeight;
  });
}

function stopStreaming(): void {
  if (timer) clearInterval(timer);
  timer = null;
  state.streaming = false;
  const last = state.turns[state.turns.length - 1];
  if (last) last.streaming = false;
  rerender();
}

function ask(question: string): void {
  if (state.streaming || question.trim() === '') return;

  const answer = answerFor(question);
  state.turns.push({ id: state.nextId++, role: 'you', text: question.trim() });
  state.draft = '';
  state.attachments = [];
  state.streaming = true;

  const reply: Turn = {
    id: state.nextId++,
    role: 'assistant',
    text: '',
    streaming: true,
    tools: answer.tools,
    sources: answer.sources,
    ...(answer.chart ? { chart: answer.chart } : {}),
  };
  state.turns.push(reply);
  rerender();
  stickToBottom();

  // A word at a time rather than a character: closer to how a model actually
  // arrives, and it does not make the layout jitter on every frame.
  const words = answer.text.split(/(\s+)/);
  let index = 0;
  timer = setInterval(() => {
    reply.text += words.slice(index, index + 2).join('');
    index += 2;
    if (index >= words.length) {
      reply.streaming = false;
      state.streaming = false;
      if (timer) clearInterval(timer);
      timer = null;
    }
    rerender();
    stickToBottom();
  }, 46);
}

function openThread(id: number): void {
  if (timer) clearInterval(timer);
  timer = null;
  state.streaming = false;
  state.thread = id;
  state.turns = [];
  state.draft = '';

  // Thread one opens with an answer already in it, so the transcript shows
  // what a finished exchange looks like as well as an arriving one.
  if (id === 1) {
    const answer = ANSWERS['revenue']!;
    state.turns = [
      { id: state.nextId++, role: 'you', text: 'Why is revenue down 3% this month?' },
      {
        id: state.nextId++,
        role: 'assistant',
        text: answer.text,
        tools: answer.tools,
        sources: answer.sources,
        ...(answer.chart ? { chart: answer.chart } : {}),
      },
    ];
  }
  rerender();
}

openThread(1);

/* ------------------------------------------------------------------- views */

/** The sources the reader is currently looking at: the newest answer's. */
function currentSources(): readonly Source[] {
  for (let i = state.turns.length - 1; i >= 0; i--) {
    const turn = state.turns[i]!;
    if (turn.role === 'assistant' && (turn.sources?.length ?? 0) > 0) return turn.sources!;
  }
  return [];
}

function threadRail(): TemplateResult {
  const spaces = [...new Set(THREADS.map((t) => t.space))];

  return html`<aside class=${classMap({ 'chat-rail': true, collapsed: state.railCollapsed })}>
    <div class="chat-rail-head">
      <span class="brand-mark"><kt-icon name="sparkles" size="16"></kt-icon></span>
      <span class="brand-copy">
        <span class="brand-name">Atlas</span>
        <span class="brand-sub">Workspace assistant</span>
      </span>
    </div>

    <kt-button
      full-width
      icon="plus"
      @click=${() => {
        openThread(0);
        toaster.info('New conversation. Ask anything, or take a suggestion.');
      }}
      >New chat</kt-button
    >

    <div class="chat-rail-scroll">
      ${spaces.map(
        (space) => html`
          <div class="chat-space">
            <span class="overline">${space}</span>
            ${THREADS.filter((thread) => thread.space === space).map(
              (thread) => html`
                <button
                  class=${classMap({ 'chat-thread': true, active: state.thread === thread.id })}
                  @click=${() => openThread(thread.id)}
                >
                  <kt-icon name="message-square" size="14"></kt-icon>
                  <span class="chat-thread-title">${thread.title}</span>
                  <span class="chat-thread-when">${thread.group}</span>
                </button>
              `,
            )}
          </div>
        `,
      )}
    </div>

    <div class="chat-rail-foot">
      <kt-meter label="Monthly messages" used="1,284" total="of 5,000" value="26"></kt-meter>
      <a class="chat-back" href="#/guide/introduction">
        <kt-icon name="arrow-left" size="14"></kt-icon>
        Back to the documentation
      </a>
    </div>
  </aside>`;
}

function toolCall(call: ToolCall): TemplateResult {
  return html`<kt-collapsible class="tool-call">
    <span slot="summary" class="tool-head">
      <kt-icon name="terminal" size="14"></kt-icon>
      <kt-badge variant="code" label=${call.name}></kt-badge>
      <span class="muted">${call.rows ? `${call.rows} rows` : 'done'}</span>
    </span>
    <div class="tool-body">
      <span class="overline">Arguments</span>
      <kt-code language="json" copy>${call.args}</kt-code>
      <span class="overline">Result</span>
      <p class="muted" style="margin:0">${call.result}</p>
    </div>
  </kt-collapsible>`;
}

function assistantTurn(turn: Turn): TemplateResult {
  return html`<article class="chat-turn assistant">
    <span class="chat-mark"><kt-icon name="sparkles" size="15"></kt-icon></span>

    <div class="chat-body">
      ${
        (turn.tools?.length ?? 0) > 0
          ? html`<div class="tool-calls">${turn.tools!.map((call) => toolCall(call))}</div>`
          : nothing
      }
      ${
        turn.text === '' && turn.streaming
          ? html`<div class="chat-waiting">
              <kt-skeleton variant="text" width="70%"></kt-skeleton>
              <kt-skeleton variant="text" width="90%"></kt-skeleton>
              <kt-skeleton variant="text" width="45%"></kt-skeleton>
            </div>`
          : html`<div class="chat-prose">
              ${turn.text.split('\n\n').map((para) => html`<p>${para}</p>`)}
              ${turn.streaming ? html`<span class="caret"></span>` : nothing}
            </div>`
      }
      ${
        turn.chart && !turn.streaming
          ? html`<kt-card class="chat-figure">
              <span slot="header" class="overline">Weekly revenue, indexed</span>
              <kt-chart
                type="bar"
                height="150"
                label="Weekly revenue, indexed to the period average"
                .labels=${turn.chart.labels}
                .series=${[{ name: 'Index', values: turn.chart.values }]}
              ></kt-chart>
            </kt-card>`
          : nothing
      }
      ${
        (turn.sources?.length ?? 0) > 0 && !turn.streaming
          ? html`<div class="chat-cites">
              ${turn.sources!.map(
                (source, index) =>
                  html`<kt-tooltip text=${source.snippet}>
                    <span class="cite">${index + 1} · ${source.title}</span>
                  </kt-tooltip>`,
              )}
            </div>`
          : nothing
      }
      ${
        turn.streaming
          ? nothing
          : html`<div class="chat-actions">
              <kt-button
                variant="secondary-no-bg"
                size="small"
                icon="copy"
                label="Copy the answer"
                @click=${() => toaster.success('Answer copied')}
              ></kt-button>
              <kt-button
                variant="secondary-no-bg"
                size="small"
                icon="refresh-cw"
                label="Ask again"
                @click=${() => {
                  const question = [...state.turns].reverse().find((t) => t.role === 'you')?.text;
                  if (!question) return;
                  state.turns = state.turns.filter((t) => t.id !== turn.id);
                  rerender();
                  ask(question);
                }}
              ></kt-button>
              <kt-button
                variant=${turn.rating === 'up' ? 'success' : 'secondary-no-bg'}
                size="small"
                icon="thumbs-up"
                label="Helpful"
                @click=${() => {
                  turn.rating = turn.rating === 'up' ? undefined : 'up';
                  rerender();
                }}
              ></kt-button>
              <kt-button
                variant=${turn.rating === 'down' ? 'danger' : 'secondary-no-bg'}
                size="small"
                icon="thumbs-down"
                label="Not helpful"
                @click=${() => {
                  turn.rating = turn.rating === 'down' ? undefined : 'down';
                  rerender();
                }}
              ></kt-button>
            </div>`
      }
    </div>
  </article>`;
}

function transcript(): TemplateResult {
  if (state.turns.length === 0) {
    return html`<div class="chat-transcript empty">
      <div class="chat-welcome">
        <span class="chat-mark large"><kt-icon name="sparkles" size="22"></kt-icon></span>
        <h1>What would you like to know?</h1>
        <p class="muted">
          Atlas answers from this workspace only — the warehouse, the documents and the audit log.
          It shows the queries it ran and what it read.
        </p>
        <div class="chat-suggestions">
          ${SUGGESTIONS.map(
            (suggestion) => html`
              <button class="suggestion" @click=${() => ask(suggestion.text)}>
                <kt-icon name=${suggestion.icon} size="16"></kt-icon>
                <span>${suggestion.text}</span>
                <kt-icon name="arrow-up-right" size="14"></kt-icon>
              </button>
            `,
          )}
        </div>
      </div>
    </div>`;
  }

  return html`<div class="chat-transcript">
    ${state.turns.map((turn) =>
      turn.role === 'you'
        ? html`<article class="chat-turn you">
            <div class="chat-bubble">${turn.text}</div>
            <kt-avatar name="Dana Whitfield" size="small"></kt-avatar>
          </article>`
        : assistantTurn(turn),
    )}
  </div>`;
}

function answerCount(): string {
  const count = state.turns.filter((turn) => turn.role === 'assistant').length;
  return `${count} ${count === 1 ? 'answer' : 'answers'}`;
}

function composer(): TemplateResult {
  return html`<div class="chat-composer">
    ${
      state.attachments.length > 0
        ? html`<div class="chat-attachments">
            ${state.attachments.map(
              (file) => html`
                <span class="attachment">
                  <kt-icon name="paperclip" size="13"></kt-icon>
                  <span>${file}</span>
                  <button
                    class="attachment-remove"
                    aria-label=${`Remove ${file}`}
                    @click=${() => {
                      state.attachments = state.attachments.filter((f) => f !== file);
                      rerender();
                    }}
                  >
                    <kt-icon name="x" size="12"></kt-icon>
                  </button>
                </span>
              `,
            )}
          </div>`
        : nothing
    }

    <div class="chat-composer-box">
      <kt-textarea
        rows="2"
        label="Message"
        placeholder=${state.streaming ? 'Atlas is answering…' : 'Ask about this workspace…'}
        .value=${state.draft}
        ?disabled=${state.streaming}
        @kt-input=${(e: CustomEvent<{ value: string }>) => {
          state.draft = e.detail.value;
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            ask(state.draft);
          }
        }}
      ></kt-textarea>

      <div class="chat-composer-row">
        <kt-button
          variant="secondary-no-bg"
          size="small"
          icon="paperclip"
          label="Attach a file"
          @click=${() => {
            state.attachments = [
              ...state.attachments,
              `export-${state.attachments.length + 1}.csv`,
            ];
            rerender();
          }}
        ></kt-button>
        <kt-select
          size="small"
          style="width:132px"
          .clearable=${false}
          .value=${state.model}
          .options=${MODELS.map((m) => ({ id: m.id, label: m.label }))}
          @kt-change=${(e: CustomEvent<{ value: string }>) => {
            state.model = e.detail.value;
          }}
        ></kt-select>

        <span style="flex:1"></span>
        <span class="muted chat-hint">
          <kt-kbd keys="enter"></kt-kbd>
          to send
        </span>

        ${
          state.streaming
            ? html`<kt-button size="small" variant="dark" icon="square" @click=${stopStreaming}
                >Stop</kt-button
              >`
            : html`<kt-button
                size="small"
                icon="arrow-up"
                label="Send"
                ?disabled=${state.draft.trim() === ''}
                @click=${() => ask(state.draft)}
              ></kt-button>`
        }
      </div>
    </div>

    <p class="chat-note muted">
      Atlas can be wrong. Every answer names what it read — check it before acting on it.
    </p>
  </div>`;
}

function sourcePanel(): TemplateResult {
  const sources = currentSources();

  return html`<aside class=${classMap({ 'chat-sources': true, open: state.sourcesOpen })}>
    <div class="chat-sources-head">
      <span class="overline">Sources</span>
      <kt-button
        variant="secondary-no-bg"
        size="small"
        icon="panel-right"
        label="Hide the sources"
        @click=${() => {
          state.sourcesOpen = false;
          rerender();
        }}
      ></kt-button>
    </div>

    ${
      sources.length === 0
        ? html`<kt-empty-state
            compact
            icon="book-open"
            heading="Nothing read yet"
            description="What an answer leans on shows up here."
          ></kt-empty-state>`
        : html`<ul class="source-list">
            ${sources.map(
              (source, index) => html`
                <li class="source">
                  <span class="source-index">${index + 1}</span>
                  <span class="source-copy">
                    <span class="source-title">${source.title}</span>
                    <span class="source-kind">${source.kind}</span>
                    <span class="muted">${source.snippet}</span>
                  </span>
                </li>
              `,
            )}
          </ul>`
    }
  </aside>`;
}

export function chatPage(): TemplateResult {
  return html`<div
    class=${classMap({
      chat: true,
      'rail-collapsed': state.railCollapsed,
      'sources-hidden': !state.sourcesOpen,
    })}
  >
    ${threadRail()}

    <div class="chat-main">
      <header class="chat-head">
        <kt-button
          variant="secondary-no-bg"
          size="small"
          icon="panel-left"
          label="Toggle the conversations"
          @click=${() => {
            state.railCollapsed = !state.railCollapsed;
            rerender();
          }}
        ></kt-button>

        <div class="chat-head-copy">
          <span class="chat-head-title">
            ${THREADS.find((t) => t.id === state.thread)?.title ?? 'New chat'}
          </span>
          <span class="muted" style="font:var(--font-normal-small)">
            ${MODELS.find((m) => m.id === state.model)?.label} · ${answerCount()}
          </span>
        </div>

        <div class="row">
          <kt-button
            variant="secondary-no-bg"
            size="small"
            icon="share-2"
            label="Share"
          ></kt-button>
          ${
            state.sourcesOpen
              ? nothing
              : html`<kt-button
                  variant="dark"
                  size="small"
                  icon="panel-right"
                  @click=${() => {
                    state.sourcesOpen = true;
                    rerender();
                  }}
                  >Sources</kt-button
                >`
          }
        </div>
      </header>

      ${transcript()} ${composer()}
    </div>

    ${state.sourcesOpen ? sourcePanel() : nothing}
  </div>`;
}
