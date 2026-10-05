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
