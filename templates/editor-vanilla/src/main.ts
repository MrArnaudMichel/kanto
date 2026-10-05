import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import type {
  KtAppShell,
  KtConfirmDialog,
  KtSegmentedControl,
  KtSidePanel,
  KtTree,
} from 'kanto-ds';
import { applyBrand } from './brand';
import { APP, DEFAULT_FOLDER } from './content';
import {
  createDoc,
  deleteDoc,
  restoreVersion,
  titleOf,
  treeOf,
  updateBody,
  wordCount,
  type Doc,
} from './documents';
import { formatField, type Format } from './formatting';
import { renderMarkdown } from './markdown';
import { changedIds, loadDocs, mergeDocs, saveChanges, watchDocs } from './store';

applyBrand();

/** An element, its attributes, and its children — text goes in as text, never as markup. */
function el<T extends HTMLElement = HTMLElement>(
  tag: string,
  attributes: Record<string, string | boolean> = {},
  children: (Node | string)[] = [],
): T {
  const node = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) node.setAttribute(name, '');
    else if (value !== false) node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const state: { docs: Doc[]; open: string | null } = { docs: loadDocs(), open: null };
const current = () => state.docs.find((doc) => doc.id === state.open);

// === The frame, built once ===

const title = el('h1', { class: 'doc-title' });
const saveState = el('span', { class: 'save-state', role: 'status' });

const mode = el<KtSegmentedControl>('kt-segmented-control', { label: 'View', size: 'small' });
mode.options = [
  { value: 'write', label: 'Write' },
  { value: 'split', label: 'Both' },
  { value: 'preview', label: 'Preview' },
];
mode.value = 'split';

const historyButton = el('kt-button', { variant: 'secondary', size: 'small', icon: 'history' }, [
  'History',
]);
const deleteButton = el('kt-button', {
  variant: 'secondary-no-bg',
  size: 'small',
  icon: 'trash-2',
  label: 'Delete document',
});

const newButton = el('kt-button', { variant: 'secondary', icon: 'square-pen' }, ['New document']);
const tree = el<KtTree>('kt-tree', { class: 'documents', label: 'Documents' });

const TOOLS: { format: Format; icon: string; label: string; keys?: string }[] = [
  { format: 'heading', icon: 'heading-2', label: 'Heading' },
  { format: 'bold', icon: 'bold', label: 'Bold', keys: 'mod b' },
  { format: 'italic', icon: 'italic', label: 'Italic', keys: 'mod i' },
  { format: 'code', icon: 'code', label: 'Code' },
  { format: 'list', icon: 'list', label: 'List' },
  { format: 'quote', icon: 'text-quote', label: 'Quote' },
  { format: 'link', icon: 'link', label: 'Link', keys: 'mod k' },
];

const area = el<HTMLTextAreaElement>('textarea', {
  class: 'page',
  'aria-label': 'Document, in Markdown',
  spellcheck: 'true',
});
const preview = el('article', { class: 'preview', 'aria-label': 'Preview' });
const panes = el('div', { class: 'panes split' }, [area, preview]);
const words = el('span', { class: 'word-count' });

const toolbar = el(
  'div',
  { class: 'toolbar', role: 'toolbar', 'aria-label': 'Formatting' },
  TOOLS.map((tool) => {
    const button = el('kt-button', {
      variant: 'secondary-no-bg',
      size: 'small',
      icon: tool.icon,
      label: tool.label,
    });
    button.addEventListener('click', () => format(tool.format));
    return el('kt-tooltip', { text: tool.label }, [button]);
  }),
);
toolbar.append(el('span', { class: 'toolbar-gap' }), mode);

const editor = el('div', { class: 'editor' }, [
  toolbar,
  panes,
  el('div', { class: 'status-bar' }, [words]),
]);
const empty = el('kt-empty-state', {
  icon: 'file-text',
  heading: 'No documents',
  description: 'Start one: it saves itself as you write.',
});
const startButton = el('kt-button', { slot: 'actions', icon: 'square-pen' }, ['New document']);
empty.append(startButton);
const missing = el('kt-error-page', { 'home-href': '#/' });

const versions = el('ul', { class: 'versions' });
const history = el<KtSidePanel>('kt-side-panel', { eyebrow: 'History', heading: 'Versions' });
history.append(
  el('p', { class: 'muted' }, ['A version is kept a minute at most, the last twenty.']),
  versions,
);
const confirm = el<KtConfirmDialog>('kt-confirm-dialog');

const shell = el<KtAppShell>('kt-app-shell', { class: 'app', label: APP.name }, [
  el('div', { slot: 'header', class: 'app-header' }, [
    title,
    saveState,
    el('div', { class: 'header-actions' }, [historyButton, deleteButton]),
  ]),
  el('div', { slot: 'sidebar', class: 'side' }, [newButton, tree]),
  editor,
  empty,
  missing,
  history,
  confirm,
]);
document.querySelector('#app')!.replaceChildren(shell);

// === Saving, a moment after the typing stops ===

let timer: ReturnType<typeof setTimeout> | undefined;
/** The documents this tab changed since it last saved: only those are written. */
const unsaved = new Set<string>();

/** Every change goes through here, so the tab knows what it has to save. */
function commit(next: Doc[]): void {
  for (const id of changedIds(state.docs, next)) unsaved.add(id);
  state.docs = next;
}

function save(): void {
  clearTimeout(timer);
  if (unsaved.size === 0) return;
  if (saveChanges(state.docs, unsaved)) {
    unsaved.clear();
    saveState.textContent = 'Saved';
  } else saveState.textContent = 'Not saved: this browser is not keeping data';
}

function persist(): void {
  clearTimeout(timer);
  saveState.textContent = 'Saving…';
  timer = setTimeout(save, 500);
}

// Leaving — a reload, a closed tab, another app — saves at once, not in a moment.
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});

// Another tab saved: take its documents, keeping what this one has not saved yet.
watchDocs((stored) => {
  state.docs = mergeDocs(stored, state.docs, unsaved);
  const doc = current();
  if (doc && !unsaved.has(doc.id) && area.value !== doc.body) area.value = doc.body;
  drawTree();
  drawDoc();
});

// === Drawing ===

function drawTree(): void {
  tree.items = treeOf(state.docs);
  tree.expanded = tree.items.map((folder) => folder.id);
  tree.selected = state.open ?? '';
}

function drawDoc(): void {
  const doc = current();
  title.textContent = doc?.title ?? '';
  document.title = doc ? `${doc.title} — ${APP.name}` : APP.name;
  preview.replaceChildren(...renderMarkdown(doc?.body ?? ''));
  const count = wordCount(doc?.body ?? '');
  words.textContent = `${count} ${count === 1 ? 'word' : 'words'}`;
}

function drawVersions(): void {
  const doc = current();
  const list = [...(doc?.versions ?? [])].reverse();
  if (list.length === 0) {
    versions.replaceChildren(
      el('kt-empty-state', {
        compact: true,
        icon: 'history',
        heading: 'No versions yet',
        description: 'Write for a while: the text you replace is kept here.',
      }),
    );
    return;
  }
  versions.replaceChildren(
    ...list.map((version) => {
      const restore = el('kt-button', { variant: 'secondary', size: 'small', icon: 'rotate-ccw' }, [
        'Restore',
      ]);
      restore.addEventListener('click', () =>
        ask(
          {
            heading: 'Restore this version?',
            message: 'The text you have now is kept as a version too, so nothing is lost.',
            confirmLabel: 'Restore',
            variant: 'primary',
          },
          () => {
            if (!state.open) return;
            commit(restoreVersion(state.docs, state.open, version.at, Date.now()));
            area.value = current()?.body ?? '';
            drawDoc();
            drawTree();
            drawVersions();
            persist();
          },
        ),
      );
      return el('li', { class: 'version' }, [
        el('div', { class: 'version-copy' }, [
          el('span', { class: 'version-when' }, [when.format(version.at)]),
          el('span', { class: 'version-text' }, [
            version.body.trim() ? titleOf(version.body) : 'Empty',
          ]),
        ]),
        restore,
      ]);
    }),
  );
}

/** Shows the document at `id`, the empty state, or the page that is not there. */
function show(id: string | null): void {
  state.open = id;
  const doc = current();
  const none = state.docs.length === 0;
  editor.hidden = !doc;
  empty.hidden = !none;
  missing.hidden = Boolean(doc) || none;
  for (const control of [mode, historyButton, deleteButton]) control.hidden = !doc;
  area.value = doc?.body ?? '';
  drawTree();
  drawDoc();
  shell.sidebarOpen = false;
}

// === Where the reader is: #/doc/<id> ===

function route(): void {
  const id = /^#\/doc\/(.+)$/.exec(location.hash)?.[1];
  if (!id) {
    const first = state.docs[0];
    if (first) location.replace(`#/doc/${first.id}`);
    else show(null);
    return;
  }
  show(decodeURIComponent(id));
}
window.addEventListener('hashchange', route);

// === Writing ===

area.addEventListener('input', () => {
  if (!state.open) return;
  const before = current()?.title;
  commit(updateBody(state.docs, state.open, area.value, Date.now()));
  drawDoc();
  if (current()?.title !== before) drawTree();
  persist();
});

function format(kind: Format): void {
  formatField(area, kind);
}

area.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  const tool = TOOLS.find((candidate) => candidate.keys === `mod ${event.key.toLowerCase()}`);
  if (!tool) return;
  event.preventDefault();
  format(tool.format);
});

mode.addEventListener('kt-change', (event) => {
  const value = (event as CustomEvent<{ value: string }>).detail.value;
  panes.className = `panes ${value}`;
});

// === Documents ===

function startDoc(): void {
  const made = createDoc(state.docs, current()?.folder ?? DEFAULT_FOLDER, Date.now());
  commit(made.list);
  persist();
  location.hash = `#/doc/${made.id}`;
  area.focus();
}
newButton.addEventListener('click', startDoc);
startButton.addEventListener('click', startDoc);

tree.addEventListener('kt-select', (event) => {
  const { id } = (event as CustomEvent<{ id: string }>).detail;
  if (!id.startsWith('folder:')) location.hash = `#/doc/${id}`;
});

historyButton.addEventListener('click', () => {
  drawVersions();
  history.open = true;
});

deleteButton.addEventListener('click', () => {
  const doc = current();
  if (!doc) return;
  ask(
    {
      heading: `Delete “${doc.title}”?`,
      message: 'It goes for good, with its history.',
      confirmLabel: 'Delete',
      variant: 'danger',
    },
    () => {
      commit(deleteDoc(state.docs, doc.id));
      persist();
      location.hash = '#/';
    },
  );
});

/** One dialog for every question; `onConfirm` runs only on yes. */
let onConfirm: (() => void) | undefined;
function ask(
  question: {
    heading: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'primary';
  },
  then: () => void,
): void {
  confirm.heading = question.heading;
  confirm.message = question.message;
  confirm.confirmLabel = question.confirmLabel;
  confirm.variant = question.variant;
  onConfirm = then;
  confirm.open = true;
}
confirm.addEventListener('kt-confirm', () => {
  confirm.open = false;
  onConfirm?.();
  onConfirm = undefined;
});
confirm.addEventListener('kt-cancel', () => {
  confirm.open = false;
  onConfirm = undefined;
});

saveState.textContent = 'Saved';
route();
