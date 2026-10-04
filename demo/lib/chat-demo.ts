/**
 * The home page's assistant demo: a conversation in kt-chat-message and the
 * field to carry it on in kt-prompt-input. The answers are written here — it
 * shows the components, not a model — and arrive the way a model's do: a
 * moment of thinking, then word by word, or all at once under reduced motion.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { KtPromptSubmitDetail } from 'kanto-ds';

interface Message {
  readonly from: 'user' | 'assistant';
  text: string;
  thinking: boolean;
  streaming: boolean;
}

const OPENING: readonly Message[] = [
  {
    from: 'user',
    text: 'How did revenue do this month?',
    thinking: false,
    streaming: false,
  },
  {
    from: 'assistant',
    text: 'Revenue reached $48,210, up 12% on last month — three new Team plans did most of it.',
    thinking: false,
    streaming: false,
  },
];

/** What the demo answers, by the first word of the question it finds. */
const ANSWERS: readonly { words: readonly string[]; answer: string }[] = [
  {
    words: ['overdue', 'late', 'unpaid'],
    answer:
      'Three invoices are overdue: Umbrella ($320), Stark Industries ($980) and one from last quarter. I can draft a reminder for each.',
  },
  {
    words: ['customer', 'client', 'who'],
    answer:
      'Hooli is your largest customer this year at $24,600, then Initech and Acme Corp. Acme sends the most invoices: eighteen.',
  },
  {
    words: ['remind', 'email', 'draft', 'write'],
    answer:
      'Here is a draft: “Hi — a quick note that invoice INV-2038 is now past due. You can pay it from the link below. Thank you!”',
  },
];
const FALLBACK =
  'This demo answers from a few written replies — ask about overdue invoices, your customers, or a reminder to send. In your product, this is where your model speaks.';

let messages: Message[] = OPENING.map((message) => ({ ...message }));

export function resetChat(): void {
  messages = OPENING.map((message) => ({ ...message }));
}

function answerTo(question: string): string {
  const asked = question.toLowerCase();
  return (
    ANSWERS.find((entry) => entry.words.some((word) => asked.includes(word)))?.answer ?? FALLBACK
  );
}

const stillness = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function reply(question: string, rerender: () => void): Promise<void> {
  const message: Message = { from: 'assistant', text: '', thinking: true, streaming: false };
  messages.push(message);
  const words = answerTo(question).split(' ');
  // The question leaves at once; the answer is the reply's business.
  const sent = new Promise<void>((done) => setTimeout(done, 500));
  setTimeout(() => {
    message.thinking = false;
    if (stillness()) {
      message.text = words.join(' ');
      rerender();
      return;
    }
    message.streaming = true;
    let index = 0;
    const next = () => {
      message.text = words.slice(0, ++index).join(' ');
      if (index >= words.length) message.streaming = false;
      rerender();
      if (index < words.length) setTimeout(next, 45);
    };
    next();
  }, 1200);
  return sent;
}

export function chatDemo(rerender: () => void): TemplateResult {
  return html`<div
      class="home-chat-log"
      role="log"
      aria-label="Conversation with Northwind AI"
      ${ref((log) => {
        // The newest message in view, as a chat keeps it.
        if (log instanceof HTMLElement) log.scrollTop = log.scrollHeight;
      })}
    >
      ${messages.map(
        (message) =>
          html`<kt-chat-message
            from=${message.from}
            name=${message.from === 'user' ? 'Dana' : 'Northwind AI'}
            ?thinking=${message.thinking}
            ?streaming=${message.streaming}
            >${message.text}</kt-chat-message
          >`,
      )}
    </div>
    <kt-prompt-input
      label="Ask Northwind AI"
      placeholder="Ask about overdue invoices, customers, a reminder…"
      @kt-submit=${(event: CustomEvent<KtPromptSubmitDetail>) => {
        const question = event.detail.value.trim();
        messages.push({ from: 'user', text: question, thinking: false, streaming: false });
        event.detail.wait(reply(question, rerender));
        rerender();
      }}
    ></kt-prompt-input>`;
}
