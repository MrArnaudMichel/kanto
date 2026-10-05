import { useRef, useState } from 'react';
import type { KtAppShell } from 'kanto-ds';
import { ASSISTANT, SEED } from './content';
import {
  addQuestion,
  appendToken,
  finishReply,
  newConversation,
  type Conversation,
} from './conversations';
import { reply } from './model';
import { Transcript } from './Transcript';

function initial(): { list: Conversation[]; open: number } {
  if (location.hash === '#new') {
    const started = newConversation(SEED);
    return { list: started.list, open: started.id };
  }
  return { list: [...SEED], open: SEED[0]!.id };
}

export function App() {
  const [start] = useState(initial);
  const [list, setList] = useState<Conversation[]>(start.list);
  const [open, setOpen] = useState(start.open);
  const shell = useRef<KtAppShell>(null);
  // One reply at a time — a ref, so a suggestion clicked mid-answer reads the truth.
  const busy = useRef(false);
  const [answering, setAnswering] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const current = list.find((conversation) => conversation.id === open);

  function choose(id: number): void {
    setOpen(id);
    // On a phone the list is a drawer: choosing from it closes it.
    if (shell.current) shell.current.sidebarOpen = false;
  }

  /** Sends a question in the open conversation; resolves once the reply has streamed. One at a time. */
  async function ask(text: string): Promise<void> {
    if (busy.current) return;
    const id = open;
    const asked = addQuestion(list, id, text);
    if (!asked) return;
    busy.current = true;
    setAnswering(true);
    setList(asked.list);
    let answer = '';
    try {
      // `id` is the conversation asked in: the reply lands there, whichever is open.
      await reply(text, (token) => {
        answer += token;
        setList((now) => appendToken(now, id, asked.replyId, token));
      });
      setList((now) => finishReply(now, id, asked.replyId));
      setAnnouncement(`${ASSISTANT.name}: ${answer}`);
    } finally {
      busy.current = false;
      setAnswering(false);
    }
  }

  return (
    <kt-app-shell ref={shell} className="app" label={ASSISTANT.name}>
      <div slot="header" className="app-header">
        <span className="app-title">{current?.title ?? ''}</span>
      </div>
      <div slot="sidebar" className="side">
        <kt-button
          className="new-chat"
          icon="square-pen"
          variant="secondary"
          onClick={() => {
            const started = newConversation(list);
            setList((now) => [started.list[0]!, ...now]);
            choose(started.id);
          }}
        >
          New chat
        </kt-button>
        <ul className="conversations" aria-label="Conversations">
          {list.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className="conversation"
                aria-current={conversation.id === open ? 'true' : undefined}
                onClick={() => choose(conversation.id)}
              >
                {conversation.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="chat">
        <Transcript conversation={current} onAsk={(text) => void ask(text)} />
        <div className="composer">
          <kt-prompt-input
            label={`Ask ${ASSISTANT.name}`}
            placeholder="Ask about your numbers…"
            disabled={answering}
            onkt-submit={(event) => event.detail.wait(ask(event.detail.value))}
          />
        </div>
        <p className="announcer" role="status">
          {announcement}
        </p>
      </div>
    </kt-app-shell>
  );
}
