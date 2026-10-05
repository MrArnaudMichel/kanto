import { useLayoutEffect, useRef } from 'react';
import { ASSISTANT, PERSON, SUGGESTIONS } from './content';
import type { Conversation } from './conversations';

/** The open conversation — or, when it is empty, what to ask. */
export function Transcript({
  conversation,
  onAsk,
}: {
  conversation: Conversation | undefined;
  onAsk: (text: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // The newest message stays in view while a reply streams, unless the reader scrolled up.
  useLayoutEffect(() => {
    const element = box.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
  });

  const messages = conversation?.messages ?? [];
  return (
    <div
      ref={box}
      className="transcript"
      aria-live="polite"
      onScroll={(event) => {
        const element = event.currentTarget;
        pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
      }}
    >
      {messages.length === 0 ? (
        <kt-empty-state
          icon="sparkles"
          heading={`Ask ${ASSISTANT.name}`}
          description={ASSISTANT.tagline}
        >
          <div className="suggestions">
            {SUGGESTIONS.map((text) => (
              <kt-button key={text} variant="secondary" size="small" onClick={() => onAsk(text)}>
                {text}
              </kt-button>
            ))}
          </div>
        </kt-empty-state>
      ) : (
        messages.map((message) => (
          <kt-chat-message
            key={message.id}
            from={message.from}
            name={message.from === 'user' ? PERSON.name : ASSISTANT.name}
            thinking={message.from === 'assistant' && message.streaming && message.text === ''}
            streaming={message.streaming && message.text !== ''}
          >
            <p className="message-text">{message.text}</p>
          </kt-chat-message>
        ))
      )}
    </div>
  );
}
