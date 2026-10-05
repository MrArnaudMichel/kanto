import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import type { KtAppShell, KtChatMessage } from 'kanto-ds';
import { applyBrand } from './brand';
import { ASSISTANT, PERSON, SEED, SUGGESTIONS } from './content';
import {
  addQuestion,
  appendToken,
  finishReply,
  newConversation,
  type Conversation,
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

const state: { list: Conversation[]; open: number } = { list: [...SEED], open: SEED[0]!.id };
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
const transcript = el('div', { class: 'transcript', 'aria-live': 'polite' });
const prompt = el('kt-prompt-input', {
  label: `Ask ${ASSISTANT.name}`,
  placeholder: 'Ask about your numbers…',
});
const shell = el('kt-app-shell', { class: 'app', label: ASSISTANT.name }, [
  el('div', { slot: 'header', class: 'app-header' }, [title]),
  el('div', { slot: 'sidebar', class: 'side' }, [newChat, list]),
  el('div', { class: 'chat' }, [transcript, el('div', { class: 'composer' }, [prompt])]),
]) as KtAppShell;
document.querySelector('#app')!.replaceChildren(shell);

// === Drawing the state ===

function open(id: number): void {
  state.open = id;
  // On a phone the list is a drawer: choosing from it closes it.
  shell.sidebarOpen = false;
  render();
}

function render(): void {
  const current = state.list.find((conversation) => conversation.id === state.open);
  const pinned = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 40;

  title.textContent = current?.title ?? '';
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

  if (!current || current.messages.length === 0) {
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
  } else {
    transcript.replaceChildren(
      ...current.messages.map((message) => {
        const node = el('kt-chat-message', {}, [
          el('p', { class: 'message-text' }, [message.text]),
        ]) as KtChatMessage;
        node.from = message.from;
        node.name = message.from === 'user' ? PERSON.name : ASSISTANT.name;
        node.thinking = message.from === 'assistant' && message.streaming && message.text === '';
        node.streaming = message.streaming && message.text !== '';
        return node;
      }),
    );
  }

  // The newest message stays in view while a reply streams, unless the reader scrolled up.
  if (pinned) transcript.scrollTop = transcript.scrollHeight;
}

// === Asking ===

/** Sends a question in the open conversation; resolves once the reply has streamed. */
async function ask(text: string): Promise<void> {
  const id = state.open;
  const asked = addQuestion(state.list, id, text);
  if (!asked) return;
  state.list = asked.list;
  render();
  // `id` is the conversation asked in: the reply lands there, whichever is open.
  await reply(text, (token) => {
    state.list = appendToken(state.list, id, asked.replyId, token);
    render();
  });
  state.list = finishReply(state.list, id, asked.replyId);
  render();
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

render();
