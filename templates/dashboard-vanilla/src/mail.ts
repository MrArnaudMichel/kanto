/**
 * The mailbox, loaded once and kept while the reader moves between screens:
 * what they read, starred or archived stays so, and the shell's unread count
 * follows it.
 */
import { listMail, type Message } from './data/api';
import { unreadCount } from './views';

let messages: Message[] = [];
let loading: Promise<void> | undefined;
const listeners = new Set<(messages: readonly Message[]) => void>();

export async function loadMail(): Promise<readonly Message[]> {
  loading ??= listMail().then((loaded) => {
    messages = [...loaded];
  });
  await loading;
  return messages;
}

export function updateMail(next: Message[]): void {
  messages = next;
  for (const listener of listeners) listener(next);
}

/** Calls `listener` with every change, and with the mail once it has loaded. */
export function watchUnread(listener: (count: number) => void): void {
  listeners.add((next) => listener(unreadCount(next)));
  void loadMail().then((loaded) => listener(unreadCount(loaded)));
}
