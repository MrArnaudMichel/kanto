/**
 * Where the documents are kept: this browser's storage. Replace these with
 * calls to your backend and the editor does not change — a backend would also
 * want to settle two people editing the same document, which this does not.
 */
import { DEFAULT_FOLDER, SEED } from './content';
import { titleOf, type Doc, type Version } from './documents';

export const STORAGE_KEY = 'kanto-editor';

/** A saved item made into a document, or null when it is not one. */
function mend(item: unknown): Doc | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  if (typeof raw['id'] !== 'string' || typeof raw['body'] !== 'string') return null;
  const versions = Array.isArray(raw['versions'])
    ? (raw['versions'] as unknown[]).filter(
        (version): version is Version =>
          !!version &&
          typeof (version as Version).at === 'number' &&
          typeof (version as Version).body === 'string',
      )
    : [];
  return {
    id: raw['id'],
    body: raw['body'],
    title: titleOf(raw['body']),
    folder: typeof raw['folder'] === 'string' && raw['folder'] ? raw['folder'] : DEFAULT_FOLDER,
    updated: typeof raw['updated'] === 'number' ? raw['updated'] : 0,
    versions,
  };
}

/** What is saved: null when nothing has been, or it cannot be read. */
function readSaved(): Doc[] | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text === null) return null;
    const saved = JSON.parse(text) as unknown;
    if (!Array.isArray(saved)) return null;
    const docs = saved.map(mend).filter((doc): doc is Doc => doc !== null);
    // Nothing usable in a list that had something: start again from the examples.
    return docs.length === 0 && saved.length > 0 ? null : docs;
  } catch {
    return null;
  }
}

/** The documents: the saved ones — none, if all were deleted — or the examples on a first visit. */
export const loadDocs = (): Doc[] => readSaved() ?? [...SEED];

/** The documents `after` has that `before` did not have, or has changed or lost. */
export function changedIds(before: readonly Doc[], after: readonly Doc[]): Set<string> {
  const ids = new Set<string>();
  const was = new Map(before.map((doc) => [doc.id, doc]));
  for (const doc of after) if (was.get(doc.id) !== doc) ids.add(doc.id);
  const now = new Set(after.map((doc) => doc.id));
  for (const doc of before) if (!now.has(doc.id)) ids.add(doc.id);
  return ids;
}

/**
 * Another tab's documents with this tab's changes on top: ours where we
 * changed them (or deleted them), theirs everywhere else, and what they made
 * that we have not seen.
 */
export function mergeDocs(
  stored: readonly Doc[],
  local: readonly Doc[],
  changed: ReadonlySet<string>,
): Doc[] {
  const theirs = new Map(stored.map((doc) => [doc.id, doc]));
  const mine = new Set(local.map((doc) => doc.id));
  const kept = local.flatMap((doc) => {
    if (changed.has(doc.id)) return [doc];
    const fresh = theirs.get(doc.id);
    return fresh ? [fresh] : [];
  });
  const arrived = stored.filter((doc) => !mine.has(doc.id) && !changed.has(doc.id));
  return [...arrived, ...kept];
}

/**
 * Saves what changed in this tab over what is saved now, so two tabs do not
 * undo each other. False when the browser would not keep it.
 */
export function saveChanges(local: readonly Doc[], changed: ReadonlySet<string>): boolean {
  try {
    const merged = mergeDocs(readSaved() ?? local, local, changed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

/** Calls `listener` with the documents whenever another tab saves them. */
export function watchDocs(listener: (docs: Doc[]) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener(loadDocs());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
