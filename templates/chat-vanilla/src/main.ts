import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import type { KtAppShell, KtChatMessage, KtPromptInput } from 'kanto-ds';
import { applyBrand } from './brand';
import { ASSISTANT, PERSON, SEED, SUGGESTIONS } from './content';
import {
  addQuestion,
  appendToken,
  finishReply,
  newConversation,
  type Conversation,
  type Message,
} from './conversations';
import { reply } from './model';

applyBrand();

/** An element, its attributes, and its children — text goes in as text, never as markup. */
function el(
  tag: string,
  attributes: Record<string, string | boolean> = {},
  children: (Node | string)[] = [],
): HTMLElement {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) node.setAttribute(name, '');
    else if (value !== false) node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

const state: { list: Conversation[]; open: number; busy: boolean } = {
  list: [...SEED],
  open: SEED[0]!.id,
  busy: false,
};
if (location.hash === '#new') {
  const started = newConversation(state.list);
  state.list = started.list;
  state.open = started.id;
}

// === The frame, built once ===

const title = el('span', { class: 'app-title' });
const newChat = el('kt-button', { class: 'new-chat', icon: 'square-pen', variant: 'secondary' }, [
  'New chat',
]);
const list = el('ul', { class: 'conversations', 'aria-label': 'Conversations' });
const transcript = el('div', { class: 'transcript' });
const announcer = el('p', { class: 'announcer', role: 'status' });
const prompt = el('kt-prompt-input', {
  label: `Ask ${ASSISTANT.name}`,
  placeholder: 'Ask about your numbers…',
}) as KtPromptInput;
const shell = el('kt-app-shell', { class: 'app', label: ASSISTANT.name }, [
  el('div', { slot: 'header', class: 'app-header' }, [title]),
  el('div', { slot: 'sidebar', class: 'side' }, [newChat, list]),
  el('div', { class: 'chat' }, [transcript, el('div', { class: 'composer' }, [prompt]), announcer]),
]) as KtAppShell;
document.querySelector('#app')!.replaceChildren(shell);

const current = () => state.list.find((conversation) => conversation.id === state.open);

// === Keeping the newest message in view ===

// Whether the reader is at the bottom: set by their scrolling, kept while the content grows.
let pinned = true;
transcript.addEventListener('scroll', () => {
  pinned = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 40;
});
/** After the messages have drawn themselves — they render a beat later — follow the newest. */
function follow(): void {
  requestAnimationFrame(() => {
    if (pinned) transcript.scrollTop = transcript.scrollHeight;
  });
}

// === Drawing ===

/** The list and the title: redrawn when a conversation starts, is titled, or is opened. */
function drawList(): void {
  title.textContent = current()?.title ?? '';
  list.replaceChildren(
    ...state.list.map((conversation) => {
      const button = el(
        'button',
        {
          type: 'button',
          class: 'conversation',
          'aria-current': conversation.id === state.open ? 'true' : false,
        },
        [conversation.title],
      );
      button.addEventListener('click', () => open(conversation.id));
      return el('li', {}, [button]);
    }),
  );
}

/** The messages on screen, by id, so a streamed word patches one message, not the transcript. */
const shown = new Map<number, KtChatMessage>();

function paint(node: KtChatMessage, message: Message): void {
  node.thinking = message.from === 'assistant' && message.streaming && message.text === '';
  node.streaming = message.streaming && message.text !== '';
  node.querySelector('.message-text')!.textContent = message.text;
}

function drawTranscript(): void {
  shown.clear();
  const conversation = current();
  if (!conversation || conversation.messages.length === 0) {
    const suggestions = SUGGESTIONS.map((text) => {
      const button = el('kt-button', { variant: 'secondary', size: 'small' }, [text]);
      button.addEventListener('click', () => void ask(text));
      return button;
    });
    transcript.replaceChildren(
      el(
        'kt-empty-state',
        { icon: 'sparkles', heading: `Ask ${ASSISTANT.name}`, description: ASSISTANT.tagline },
        [el('div', { class: 'suggestions' }, suggestions)],
      ),
    );
    return;
  }
  transcript.replaceChildren(
    ...conversation.messages.map((message) => {
      const node = el('kt-chat-message', {}, [el('p', { class: 'message-text' })]) as KtChatMessage;
      node.from = message.from;
      node.name = message.from === 'user' ? PERSON.name : ASSISTANT.name;
      paint(node, message);
      shown.set(message.id, node);
      return node;
    }),
  );
  follow();
}

function open(id: number): void {
  state.open = id;
  pinned = true;
  // On a phone the list is a drawer: choosing from it closes it.
  shell.sidebarOpen = false;
  drawList();
  drawTranscript();
}

// === Asking ===

/** Updates one message in state, and on screen if it is showing. */
function update(conversationId: number, messageId: number, next: Conversation[]): void {
  state.list = next;
  const message = state.list
    .find((conversation) => conversation.id === conversationId)
    ?.messages.find((item) => item.id === messageId);
  const node = shown.get(messageId);
  if (message && node && conversationId === state.open) {
    paint(node, message);
    follow();
  }
}

/** Sends a question in the open conversation; resolves once the reply has streamed. One at a time. */
async function ask(text: string): Promise<void> {
  if (state.busy) return;
  const id = state.open;
  const asked = addQuestion(state.list, id, text);
  if (!asked) return;
  state.list = asked.list;
  state.busy = true;
  prompt.disabled = true;
  drawList();
  drawTranscript();
  try {
    // `id` is the conversation asked in: the reply lands there, whichever is open.
    await reply(text, (token) =>
      update(id, asked.replyId, appendToken(state.list, id, asked.replyId, token)),
    );
    update(id, asked.replyId, finishReply(state.list, id, asked.replyId));
    const answer = state.list
      .find((item) => item.id === id)
      ?.messages.find((m) => m.id === asked.replyId);
    announcer.textContent = `${ASSISTANT.name}: ${answer?.text ?? ''}`;
  } finally {
    state.busy = false;
    prompt.disabled = false;
  }
}

prompt.addEventListener('kt-submit', (event) => {
  const { value, wait } = (
    event as CustomEvent<{ value: string; wait: (promise: Promise<unknown>) => void }>
  ).detail;
  wait(ask(value));
});

newChat.addEventListener('click', () => {
  const started = newConversation(state.list);
  state.list = started.list;
  open(started.id);
});

drawList();
drawTranscript();
