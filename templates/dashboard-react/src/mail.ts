/**
 * The mailbox, loaded once and kept while the reader moves between screens:
 * what they read, starred or archived stays so, and the shell's unread count
 * follows it.
 */
import { useSyncExternalStore } from 'react';
import { listMail, type Message } from './data/api';

let messages: readonly Message[] | null = null;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  loading ??= listMail().then((loaded) => {
    messages ??= loaded;
    for (const notify of listeners) notify();
  });
  return () => listeners.delete(listener);
}

export function setMail(next: readonly Message[]): void {
  messages = next;
  for (const notify of listeners) notify();
}

/** The mail, or null while it loads. */
export const useMail = (): readonly Message[] | null =>
  useSyncExternalStore(subscribe, () => messages);
