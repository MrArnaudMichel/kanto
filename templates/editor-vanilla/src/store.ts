/**
 * Where the documents are kept: this browser's storage. Replace these two
 * functions with calls to your backend and the editor does not change.
 */
import { SEED } from './content';
import type { Doc } from './documents';

const KEY = 'kanto-editor';

export function loadDocs(): Doc[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as unknown;
    if (Array.isArray(saved) && saved.length > 0) return saved as Doc[];
  } catch {
    // Blocked or unreadable storage: start from the examples.
  }
  return [...SEED];
}

/** Returns false when the browser would not keep them, so the page can say so. */
export function saveDocs(list: readonly Doc[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
