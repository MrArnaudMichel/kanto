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
