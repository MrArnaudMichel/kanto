/**
 * Documents, as plain data: create, edit, keep versions, restore, delete.
 * Every function returns a new list, so any stack can hold it as state.
 */
import type { KtTreeItem } from 'kanto-ds';

export interface Version {
  /** When this text was replaced, in ms. */
  readonly at: number;
  readonly body: string;
}

export interface Doc {
  readonly id: string;
  readonly title: string;
  readonly folder: string;
  readonly body: string;
  /** Last edited, in ms. */
  readonly updated: number;
  /** Older texts, oldest first. */
  readonly versions: readonly Version[];
}

/** A version at most this often, however fast someone types. */
export const VERSION_EVERY = 60_000;
/** The versions kept per document. */
export const VERSIONS_KEPT = 20;

/** The first heading, else the first line, else "Untitled". */
export function titleOf(body: string): string {
  const line = body
    .split('\n')
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate !== '');
  return line ? line.replace(/^#+\s*/, '').trim() || 'Untitled' : 'Untitled';
}

export function wordCount(body: string): number {
  return body.split(/[^\p{L}\p{N}'’-]+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

let next = 0;

export function createDoc(
  list: readonly Doc[],
  folder: string,
  now: number,
): { list: Doc[]; id: string } {
  const id = `doc-${now.toString(36)}-${(next += 1)}`;
  const doc: Doc = { id, title: 'Untitled', folder, body: '', updated: now, versions: [] };
  return { list: [doc, ...list], id };
}

const replace = (list: readonly Doc[], id: string, change: (doc: Doc) => Doc): Doc[] =>
  list.map((doc) => (doc.id === id ? change(doc) : doc));

/** Keeps what `body` replaces as a version, at most once a minute. */
function withVersion(doc: Doc, now: number): readonly Version[] {
  const last = doc.versions.at(-1);
  if (last && now - last.at < VERSION_EVERY) return doc.versions;
  return [...doc.versions, { at: now, body: doc.body }].slice(-VERSIONS_KEPT);
}

export function updateBody(list: readonly Doc[], id: string, body: string, now: number): Doc[] {
  return replace(list, id, (doc) =>
    doc.body === body
      ? doc
      : { ...doc, body, title: titleOf(body), updated: now, versions: withVersion(doc, now) },
  );
}

/** Brings an older text back; the text it replaces becomes a version, so nothing is lost. */
export function restoreVersion(list: readonly Doc[], id: string, at: number, now: number): Doc[] {
  return replace(list, id, (doc) => {
    const version = doc.versions.find((candidate) => candidate.at === at);
    if (!version) return doc;
    return {
      ...doc,
      body: version.body,
      title: titleOf(version.body),
      updated: now,
      versions: [...doc.versions, { at: now, body: doc.body }].slice(-VERSIONS_KEPT),
    };
  });
}

export const deleteDoc = (list: readonly Doc[], id: string): Doc[] =>
  list.filter((doc) => doc.id !== id);

/** The sidebar: one branch per folder, in the order folders first appear. */
export function treeOf(list: readonly Doc[]): KtTreeItem[] {
  const folders: string[] = [];
  for (const doc of list) if (!folders.includes(doc.folder)) folders.push(doc.folder);
  return folders.map((folder) => ({
    id: `folder:${folder}`,
    label: folder,
    icon: 'folder',
    children: list
      .filter((doc) => doc.folder === folder)
      .map((doc) => ({ id: doc.id, label: doc.title, icon: 'file-text' })),
  }));
}
