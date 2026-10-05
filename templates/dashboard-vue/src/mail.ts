/**
 * The mailbox, loaded once and kept while the reader moves between screens:
 * what they read, starred or archived stays so, and the shell's unread count
 * follows it.
 */
import { shallowRef } from 'vue';
import { listMail, type Message } from './data/api';

/** The mail, or null while it loads. */
export const mail = shallowRef<readonly Message[] | null>(null);

let loading: Promise<void> | undefined;

export function loadMail(): void {
  loading ??= listMail().then((loaded) => {
    mail.value ??= loaded;
  });
}
