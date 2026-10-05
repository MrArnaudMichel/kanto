# Templates, phase 3c — Chat × 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Chat template — an assistant: conversations on the side, the transcript, a prompt, and the model behind one function — in React, Vue and TypeScript, make it with `create-kanto`, run it on its template page, and retire the chat demo.

**Architecture:** As Portfolio: `templates/chat-<stack>/`, sharing what does not depend on the stack — the words (`content.ts`), the conversations (`conversations.ts`: a small store of pure functions), and the model (`model.ts`: `reply()` streams a canned answer a token at a time — the one function to point at a real model). Each stack renders the shell, the list, the transcript and the prompt. No router: the open conversation is state.

**Tech Stack:** as phase 3b; components `kt-app-shell`, `kt-button`, `kt-chat-message`, `kt-prompt-input`, `kt-empty-state`.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md`

## Global Constraints

- `templates/chat-{react,vue,vanilla}`: standalone Vite + TS, `kanto-ds@^1.9.0`, scripts `dev`/`build`/`preview`/`typecheck`, README, `.gitignore`, no lockfile, brand in `src/brand.ts`.
- The model is one `reply(question, onToken)` in `src/model.ts`, documented as where a real model goes; it streams a canned answer.
- The assistant is "Atlas", answering about Northwind's numbers (the world of the other templates).
- Messages render as text — never as HTML — in every stack.
- No router; the open conversation is state. The header shows the conversation's title.
- The walk selects by role, name, class and order, never by attributes React sets as properties (phase 3b's lesson).
- The demo goes when the template lands: `#/app/chat` and `#/apps/chat` lead to `#/templates/chat`.
- Commits only after `npm run verify`; Arnaud Michel's name, no trailer; branch `feat/templates`.

## Review Focus

1. **Asking while a reply is still streaming** — the prompt waits (it is busy until the reply ends); no two replies interleave. (`kt-prompt-input`'s `wait()`; Task 2 walk asks once and waits.)
2. **Switching conversation while a reply streams** — the reply lands in the conversation it belongs to, not the one on screen. (Task 1: `appendToken` targets a conversation by id.)
3. **An empty or blank question** — nothing is sent. (Task 1: `addQuestion` ignores blank text; `kt-prompt-input` also refuses it.)
4. **A long transcript** — it scrolls on its own and stays pinned to the newest message while one streams. (Task 2 walk asks twice; the newest is in view.)
5. **A phone** — the conversation list becomes the shell's drawer; no sideways scroll. (Task 2 walk.)

---

### Task 1: Chat's shared core

**Files:** in `templates/chat-vanilla/src/`, copied identically to `chat-react/src/` and `chat-vue/src/`: `content.ts`, `conversations.ts`, `model.ts`, `brand.ts`, `icons.ts`, `styles.css`; modify `scripts/templates.test.ts`.

**Interfaces — Produces:**

- `content.ts`: `ASSISTANT { name; tagline }`, `PERSON { name }`, `SUGGESTIONS: string[]`, `ANSWERS: { keywords: string[]; text: string }[]`, `FALLBACK: string`, `SEED: Conversation[]`.
- `conversations.ts`: types `Message { id: number; from: 'user' | 'assistant'; text: string; streaming: boolean }`, `Conversation { id: number; title: string; messages: Message[] }`; `newConversation(list): { list; id }`, `addQuestion(list, id, text): { list; replyId } | null` (null for blank text; titles an untitled conversation from the question, at most 48 characters), `appendToken(list, conversationId, messageId, token): list`, `finishReply(list, conversationId, messageId): list`, `titleOf(text): string`. All return new arrays; nothing mutates.
- `model.ts`: `answerFor(question): string`, `reply(question, onToken: (token: string) => void): Promise<void>`.

- [ ] **Step 1: The failing tests.** In `scripts/templates.test.ts`, `SHARED` gains `chat: ['src/content.ts', 'src/conversations.ts', 'src/model.ts', 'src/brand.ts', 'src/icons.ts', 'src/styles.css']`, and append:

```ts
describe('the chat', () => {
  it('starts a conversation, titles it from its first question, and ignores a blank one', async () => {
    const { addQuestion, newConversation } =
      await import('../templates/chat-vanilla/src/conversations');
    const started = newConversation([]);
    expect(started.list[0]!.title).toBe('New chat');
    expect(addQuestion(started.list, started.id, '   ')).toBeNull();
    const asked = addQuestion(
      started.list,
      started.id,
      '  Why is revenue down 3% this month, and since when exactly?  ',
    )!;
    const conversation = asked.list.find((item) => item.id === started.id)!;
    expect(conversation.title).toBe('Why is revenue down 3% this month, and since…');
    expect(conversation.messages.map((message) => message.from)).toEqual(['user', 'assistant']);
    expect(conversation.messages[1]).toMatchObject({
      id: asked.replyId,
      text: '',
      streaming: true,
    });
    expect(started.list[0]!.messages).toEqual([]);
  });

  it('streams a reply into its own conversation, whichever is open', async () => {
    const { addQuestion, appendToken, finishReply, newConversation } =
      await import('../templates/chat-vanilla/src/conversations');
    const first = newConversation([]);
    const asked = addQuestion(first.list, first.id, 'Which regions are growing?')!;
    const second = newConversation(asked.list);
    let list = appendToken(second.list, first.id, asked.replyId, 'North ');
    list = appendToken(list, first.id, asked.replyId, 'East');
    list = finishReply(list, first.id, asked.replyId);
    const reply = list.find((item) => item.id === first.id)!.messages[1]!;
    expect(reply).toMatchObject({ text: 'North East', streaming: false });
    expect(list.find((item) => item.id === second.id)!.messages).toEqual([]);
  });

  it('answers by keyword, and streams the whole answer a token at a time', async () => {
    vi.useFakeTimers();
    const { answerFor, reply } = await import('../templates/chat-vanilla/src/model');
    const { FALLBACK } = await import('../templates/chat-vanilla/src/content');
    expect(answerFor('Why is REVENUE down?')).toMatch(/Revenue fell 3%/);
    expect(answerFor('Tell me a joke')).toBe(FALLBACK);
    const tokens: string[] = [];
    const done = reply('Which regions are growing?', (token) => tokens.push(token));
    await vi.runAllTimersAsync();
    await done;
    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens.join('')).toBe(answerFor('Which regions are growing?'));
    vi.useRealTimers();
  });
});
```

Run `npx vitest run --project unit scripts/templates.test.ts` → FAIL (`../templates/chat-vanilla/src/conversations` does not resolve).

- [ ] **Step 2: The shared files.**

`src/content.ts`:

```ts
/** What the assistant is called, what it suggests, and what it knows. Rewrite freely. */
import type { Conversation } from './conversations';

export const ASSISTANT = { name: 'Atlas', tagline: 'Workspace assistant' };
export const PERSON = { name: 'Dana Whitfield' };

export const SUGGESTIONS = [
  'Why is revenue down 3% this month?',
  'Which regions are growing?',
  'What happened to churn?',
];

/** Canned answers, found by a keyword in the question — until model.ts calls a real model. */
export const ANSWERS = [
  {
    keywords: ['revenue', 'down'],
    text: 'Revenue fell 3% while orders rose 2%, so the average basket shrank rather than demand. The August discount code is the whole of it: baskets that used it are 19% smaller, and they were 38% of orders in the window. Strip them out and revenue is up 1.4%.',
  },
  {
    keywords: ['region', 'growing'],
    text: 'North East is up 11% and Midlands up 4%. South West is flat. North West is down 6%, which is most of the shortfall on its own — and all of that fall sits in accounts that joined before March.',
  },
  {
    keywords: ['churn'],
    text: 'Churn moved from 1.8% to 2.1%. Almost all of it is accounts under six months old, and within those it clusters at day 34 — a day after the trial-to-paid email goes out. That points at onboarding rather than at price.',
  },
];

export const FALLBACK =
  'I answer from canned replies until src/model.ts calls a real model. Try one of the suggestions — they take the same path a real answer would.';

/** The conversations the app opens with. */
export const SEED: Conversation[] = [
  {
    id: 1,
    title: 'Why is revenue down 3%?',
    messages: [
      { id: 1, from: 'user', text: 'Why is revenue down 3% this month?', streaming: false },
      { id: 2, from: 'assistant', text: ANSWERS[0]!.text, streaming: false },
    ],
  },
  {
    id: 2,
    title: 'Which regions are growing?',
    messages: [
      { id: 3, from: 'user', text: 'Which regions are growing?', streaming: false },
      { id: 4, from: 'assistant', text: ANSWERS[1]!.text, streaming: false },
    ],
  },
];
```

`src/conversations.ts`:

```ts
/**
 * The conversations, as plain data and functions that return new data — so
 * every stack keeps them in its own state, and a reply streaming into one
 * conversation never touches another.
 */
export interface Message {
  readonly id: number;
  readonly from: 'user' | 'assistant';
  readonly text: string;
  readonly streaming: boolean;
}

export interface Conversation {
  readonly id: number;
  readonly title: string;
  readonly messages: readonly Message[];
}

const UNTITLED = 'New chat';
let next = 1000;

/** A conversation's title from its first question: at most 48 characters, cut at a word. */
export function titleOf(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= 48) return clean;
  const cut = clean.slice(0, 47);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}

export function newConversation(list: readonly Conversation[]): {
  list: Conversation[];
  id: number;
} {
  const id = (next += 1);
  return { list: [{ id, title: UNTITLED, messages: [] }, ...list], id };
}

/** The question, and an empty reply to stream into. Null when there is nothing to ask. */
export function addQuestion(
  list: readonly Conversation[],
  id: number,
  text: string,
): { list: Conversation[]; replyId: number } | null {
  const question = text.trim();
  if (!question) return null;
  const replyId = (next += 2);
  return {
    replyId,
    list: list.map((conversation) =>
      conversation.id !== id
        ? conversation
        : {
            ...conversation,
            title: conversation.messages.length === 0 ? titleOf(question) : conversation.title,
            messages: [
              ...conversation.messages,
              { id: replyId - 1, from: 'user', text: question, streaming: false },
              { id: replyId, from: 'assistant', text: '', streaming: true },
            ],
          },
    ),
  };
}

function updateMessage(
  list: readonly Conversation[],
  conversationId: number,
  messageId: number,
  change: (message: Message) => Message,
): Conversation[] {
  return list.map((conversation) =>
    conversation.id !== conversationId
      ? conversation
      : {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? change(message) : message,
          ),
        },
  );
}

export function appendToken(
  list: readonly Conversation[],
  conversationId: number,
  messageId: number,
  token: string,
): Conversation[] {
  return updateMessage(list, conversationId, messageId, (message) => ({
    ...message,
    text: message.text + token,
  }));
}

export function finishReply(
  list: readonly Conversation[],
  conversationId: number,
  messageId: number,
): Conversation[] {
  return updateMessage(list, conversationId, messageId, (message) => ({
    ...message,
    streaming: false,
  }));
}
```

`src/model.ts`:

```ts
/**
 * The model: one function. It finds a canned answer and streams it a token at
 * a time; replace its body with a call to your model's streaming API and the
 * rest of the app does not change.
 */
import { ANSWERS, FALLBACK } from './content';

export function answerFor(question: string): string {
  const words = question.toLowerCase();
  return (
    ANSWERS.find((answer) => answer.keywords.some((keyword) => words.includes(keyword)))?.text ??
    FALLBACK
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function reply(question: string, onToken: (token: string) => void): Promise<void> {
  await wait(600);
  for (const token of answerFor(question).match(/\S+\s*/g) ?? []) {
    onToken(token);
    await wait(30);
  }
}
```

`src/brand.ts`: as Portfolio's. `src/icons.ts`:

```ts
/** The icons this app draws beyond Kanto's own. Any Lucide icon works: import it, add it here. */
import { registerIcons } from 'kanto-ds/icons';
import { MessageSquare, Sparkles, SquarePen } from 'lucide';

registerIcons({ MessageSquare, Sparkles, SquarePen });
```

`src/styles.css`:

```css
/* The app's own layout. Kanto's styles.css sets its colours and type. */
html,
body,
#app {
  height: 100%;
}
.app {
  height: 100dvh;
}

.app-header {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}
.app-title {
  overflow: hidden;
  font: var(--font-normal-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.side {
  display: grid;
  gap: 12px;
  padding: 16px 12px;
}
.conversations {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.conversation {
  display: block;
  width: 100%;
  overflow: hidden;
  padding: 8px 10px;
  color: var(--text-muted);
  font: var(--font-normal-regular);
  white-space: nowrap;
  text-align: start;
  text-overflow: ellipsis;
  background: none;
  border: 0;
  border-radius: var(--border-radius);
  cursor: pointer;
}
.conversation:hover {
  color: var(--text-body);
  background-color: var(--surface-hover);
}
.conversation[aria-current='true'] {
  color: var(--text-body);
  background-color: var(--color-primary-soft);
}
.conversation:focus-visible {
  outline: var(--outline-width) solid var(--color-primary-base);
  outline-offset: 2px;
}

.chat {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100%;
}
.transcript {
  display: grid;
  gap: 20px;
  align-content: start;
  overflow-y: auto;
  padding: 32px max(24px, calc((100% - 760px) / 2));
}
.composer {
  padding: 12px max(24px, calc((100% - 760px) / 2)) 24px;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.message-text {
  margin: 0;
  white-space: pre-wrap;
}
```

Copy the six files to `chat-react/src/` and `chat-vue/src/`.

- [ ] **Step 3: Watch them pass.** `npx vitest run --project unit scripts/templates.test.ts` → PASS.
- [ ] **Step 4: No commit yet** (phase 3a ruling: `build:demo` builds every `*-vanilla`) — commits with Task 2.

---

### Task 2: `chat-vanilla`, and its walk

**Files:** `templates/chat-vanilla/{index.html,package.json,tsconfig.json,README.md,.gitignore}`, `src/main.ts`; `scripts/template-smoke.js`.

- [ ] **Step 1: The walk.** Add to `SMOKES`:

```js
  async chat(page, base) {
    const until = (check, arg) => page.waitForFunction(check, arg, { timeout: TIMEOUT });
    const ask = async (question) => {
      await page.locator('kt-prompt-input textarea').fill(question);
      await page.locator('kt-prompt-input textarea').press('Enter');
    };
    await page.goto(base);

    // The seeded conversations, the first one open.
    await until(() => document.querySelectorAll('.conversations .conversation').length >= 2);
    await until(() => document.querySelectorAll('.transcript kt-chat-message').length >= 2);

    // A new conversation: suggestions, then a question streamed into an answer.
    await page.getByRole('button', { name: 'New chat', exact: true }).click();
    await until(() => document.querySelector('.transcript kt-empty-state') !== null);
    await until(() => document.querySelectorAll('.conversations .conversation').length >= 3);
    await ask('Which regions are growing?');
    await until(() => {
      const messages = [...document.querySelectorAll('.transcript kt-chat-message')];
      const last = messages.at(-1);
      return messages.length === 2 && last?.from === 'assistant' && last.streaming === false && last.textContent.trim().length > 40;
    });
    // The conversation took its title from the question.
    await until(() => document.querySelector('.conversation[aria-current="true"]')?.textContent.includes('Which regions'));

    // Back to the first conversation: its own messages.
    await page.locator('.conversations .conversation').nth(1).click();
    await until(() => document.querySelector('.transcript kt-chat-message')?.textContent.includes('Why is revenue'));

    // A phone: no sideways scroll, and the list is in the shell's drawer.
    await page.setViewportSize({ width: 390, height: 800 });
    await until(() => document.documentElement.scrollWidth <= window.innerWidth);
    await until(() => document.querySelector('kt-app-shell')?.hasAttribute('narrow') === true);
  },
```

Run `npm run build && npm run check:templates chat-vanilla` → FAIL (`reading package.json failed`).

- [ ] **Step 2: The project files.** As `templates/saas-vanilla`'s (`lucide` kept), name `kanto-chat-vanilla`, `<title>Atlas — workspace assistant</title>`. README: "Atlas — an assistant on Kanto, in TypeScript without a framework"; what it is; the table `The model | src/model.ts — call your model here`, `What it says | src/content.ts`, `The conversations | src/conversations.ts`, `The brand | src/brand.ts`, `The app | src/main.ts`; the components list.

- [ ] **Step 3: The app.** `src/main.ts`: state `{ list: Conversation[]; open: number }` starting from `SEED` with the first open; one `render()` that redraws the list, the header title and the transcript from state (the prompt is built once and kept). Structure and hooks:
  - `kt-app-shell.app` with `label` = `ASSISTANT.name`; header slot `div.app-header` holding `span.app-title` (the open conversation's title);
  - sidebar slot `div.side`: `kt-button.new-chat` (`icon=square-pen`, `variant=secondary`, text "New chat") and `ul.conversations` of `li > button.conversation` (text = title; `aria-current="true"` on the open one), each opening its conversation;
  - default slot `div.chat`: `div.transcript` and `div.composer` with `kt-prompt-input` (`label` "Ask Atlas", `placeholder` "Ask about your numbers…");
  - the transcript: an empty conversation shows `kt-empty-state` (`icon=sparkles`, heading "Ask Atlas", description `ASSISTANT.tagline`) with `div.suggestions` of `kt-button[variant=secondary][size=small]`, each asking its suggestion; otherwise a `kt-chat-message` per message — `from`, `name` (`PERSON.name` or `ASSISTANT.name`), `thinking` when it is the assistant's and still empty and streaming, `streaming` when streaming with text — holding a `p.message-text` whose `textContent` is the text;
  - after each render, if the transcript was at the bottom before it, scroll it to the bottom (newest in view while a reply streams);
  - asking (`kt-prompt-input` `kt-submit`, or a suggestion): `addQuestion(state.list, state.open, text)`; null → nothing; else store it, render, and `wait(reply(text, (token) => { state.list = appendToken(state.list, id, replyId, token); render(); }).then(() => { state.list = finishReply(…); render(); }))` — `id` captured at the time of asking, so a reply finishes in its own conversation;
  - "New chat": `newConversation(state.list)`, open it, render, and on a narrow shell close the drawer (`shell.sidebarOpen = false`); choosing a conversation does the same.

  Import order: `kanto-ds`, `kanto-ds/styles.css`, `./styles.css`, `./icons`, then `applyBrand()`.

- [ ] **Step 4: Watch it pass, and look.** `npm run check:templates chat-vanilla` → `ok`. `npm run build:demo`, preview, screenshot `templates/chat/` at 1400px (a seeded conversation) and 390px; read them.
- [ ] **Step 5: Commit, with Task 1.** `npm run format && npm run verify`; `git add templates/chat-* scripts/templates.test.ts scripts/template-smoke.js && git commit -m "feat(templates): add the chat without a framework, on a shared core"`.

---

### Task 3: `chat-react`

**Files:** project files as `saas-react`'s without `react-router`, name `kanto-chat-react`; `src/main.tsx` (as Portfolio's React one); `src/App.tsx`; `src/Transcript.tsx`.

- [ ] **Step 1: See it fail** — `npm run check:templates chat-react` → `reading package.json failed`.
- [ ] **Step 2: The project files**, README for React (`src/App.tsx`, `src/Transcript.tsx`; the React 19 line).
- [ ] **Step 3: The app.** `App.tsx`: `useState` for the list (from `SEED`) and the open id; the same structure, classes and hooks as Task 2 Step 3; asking uses functional updates (`setList((list) => appendToken(list, id, replyId, token))`) so streamed tokens never race; `kt-prompt-input` `onkt-submit={(event) => event.detail.wait(ask(event.detail.value))}` where `ask` returns the reply's promise. `Transcript.tsx`: the empty state with suggestions, or the messages; a `ref` on `div.transcript` and an effect after each change keeping it pinned to the bottom when it was there.
- [ ] **Step 4: Watch it pass.** `npm run check:templates chat-react` → `ok`; a type error on a `kt-*` prop is a library gap, fixed first in `src/react/jsx.ts` with a test.
- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/chat-react && git commit -m "feat(templates): add the chat in React"`.

---

### Task 4: `chat-vue`

**Files:** project files as `saas-vue`'s without `vue-router`, name `kanto-chat-vue`; `src/main.ts`, `src/env.d.ts`, `src/App.vue`, `src/Transcript.vue`.

- [ ] **Step 1: See it fail** — `npm run check:templates chat-vue` → `reading package.json failed`.
- [ ] **Step 2: The project files**, README for Vue.
- [ ] **Step 3: The app.** `App.vue` with `ref`s for the list and the open id, the same structure, classes and hooks as Task 2 Step 3; `Transcript.vue` with a template ref on `div.transcript` and a `watch` (flush `post`) keeping it pinned.
- [ ] **Step 4: Watch it pass.** `npm run check:templates chat-vue` → `ok`; `npm run check:templates` → twelve `ok`.
- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/chat-vue && git commit -m "feat(templates): add the chat in Vue"`.

---

### Task 5: Chat in the tool and on the site; the demo goes

**Files:** `packages/create-kanto/{lib/choices.js,README.md,package.json}`, `demo/lib/templates.ts`, `demo/lib/templates.test.ts`, `demo/main.ts`, `demo/apps.test.ts`, `demo/shell.test.ts`, `CHANGELOG.md`; delete `demo/apps/chat.ts`, `demo/public/templates/chat-home.png`; shoot `demo/public/templates/chat-{conversation,new}.png`.

- [ ] **Step 1: The failing tests.** `demo/lib/templates.test.ts`: chat's demo is `./templates/chat/`. `demo/shell.test.ts`, "sends the old demo pages to their templates": add `['#/app/chat', 'Chat']`. `demo/apps.test.ts`: drop the `#/app/chat` route; the two "documentation chrome" tests use `#/app/console/home`; "previews the running application" keeps `console-home` only. Run `npx vitest run --project unit demo scripts` → FAIL.
- [ ] **Step 2: The tool.** `choices.js` gains `{ id: 'chat', label: 'Chat', hint: 'an assistant: conversations, streamed answers, one function for the model' }`; README and description name it.
- [ ] **Step 3: The catalog.** `chat`: `project: true`, `demo: './templates/chat/'`, `description` (Atlas; the list, the transcript, the prompt; the model in `src/model.ts`), `tryIt` (start a new chat from a suggestion; ask while one streams; switch conversation mid-answer), `routes: []`, `files` (`src/model.ts`, `src/content.ts`, `src/conversations.ts`, `src/brand.ts`), `components` (Tech Stack list), `screens: [{ file: 'chat-conversation.png', path: 'templates/chat/', caption: 'A conversation' }, { file: 'chat-new.png', path: 'templates/chat/#new', caption: 'A new chat' }]` — and in each stack's `main`, a `#new` hash on load opens a new conversation (for the screenshot and for a shared link).
- [ ] **Step 4: The demo goes.** `git rm demo/apps/chat.ts demo/public/templates/chat-home.png`; `demo/main.ts`: remove `chat` from `APPS`, `RETIRED_DEMOS` gains `chat: 'chat'`; search the docs for `#/app/chat` and point what remains at `#/templates/chat` (the home stage's chat demo in `demo/lib/chat-demo.ts` is the docs' own and stays).
- [ ] **Step 5: Shoot and run.** `npm run build:demo && node scripts/screenshot-templates.js`; read the shots; `npx vitest run --project unit demo packages scripts` → PASS.
- [ ] **Step 6: The changelog** names Chat beside SaaS, Landing and Portfolio.
- [ ] **Step 7: Commit.** `npm run format && npm run verify && npm run check:templates`; `git add -A packages demo scripts CHANGELOG.md templates && git commit -m "feat(templates): Chat in create-kanto and on the site; its demo goes"`.

## Phase 3c is done when

- `npm run check:templates` prints twelve `ok` lines; `npm run verify` passes.
- `#/templates/chat` runs the template in its frame with a command per stack; `#/app/chat`, `#/apps/chat` lead there.
