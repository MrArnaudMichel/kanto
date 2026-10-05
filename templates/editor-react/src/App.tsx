import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KtAppShell } from 'kanto-ds';
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
import { applyFormat, type Format } from './formatting';
import { Preview } from './Preview';
import { loadDocs, saveDocs } from './store';

const TOOLS: { format: Format; icon: string; label: string; keys?: string }[] = [
  { format: 'heading', icon: 'heading-2', label: 'Heading' },
  { format: 'bold', icon: 'bold', label: 'Bold', keys: 'mod b' },
  { format: 'italic', icon: 'italic', label: 'Italic', keys: 'mod i' },
  { format: 'code', icon: 'code', label: 'Code' },
  { format: 'list', icon: 'list', label: 'List' },
  { format: 'quote', icon: 'text-quote', label: 'Quote' },
  { format: 'link', icon: 'link', label: 'Link', keys: 'mod k' },
];

const MODES = [
  { value: 'write', label: 'Write' },
  { value: 'split', label: 'Both' },
  { value: 'preview', label: 'Preview' },
];

const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

interface Question {
  heading: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'primary';
  then: () => void;
}

/** The document in the address: `#/doc/<id>`. */
function useHashId(): string | null {
  const read = () => {
    const id = /^#\/doc\/(.+)$/.exec(location.hash)?.[1];
    return id ? decodeURIComponent(id) : null;
  };
  const [id, setId] = useState(read);
  useEffect(() => {
    const update = () => setId(read());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return id;
}

export function App() {
  const [docs, setDocs] = useState<Doc[]>(loadDocs);
  const id = useHashId();
  const [mode, setMode] = useState('split');
  const [saveState, setSaveState] = useState('Saved');
  const [historyOpen, setHistoryOpen] = useState(false);
  // The question stays while its dialog closes, so its words do not vanish first.
  const [question, setQuestion] = useState<Question | null>(null);
  const [asking, setAsking] = useState(false);
  const ask = (next: Question) => {
    setQuestion(next);
    setAsking(true);
  };
  const shell = useRef<KtAppShell>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The selection to put back once a format has redrawn the text.
  const selection = useRef<{ start: number; end: number } | null>(null);
  // Set by New document: the page takes the focus once it shows the new one.
  const focusNext = useRef(false);

  const doc = docs.find((candidate) => candidate.id === id);

  // No document in the address: open the first.
  useEffect(() => {
    if (id === null && docs[0]) location.replace(`#/doc/${docs[0].id}`);
  }, [id, docs]);

  useEffect(() => {
    document.title = doc ? `${doc.title} — ${APP.name}` : APP.name;
  }, [doc]);

  // A document chosen: the drawer closes, and a new one takes the focus.
  useEffect(() => {
    if (shell.current) shell.current.sidebarOpen = false;
    if (focusNext.current) {
      focusNext.current = false;
      area.current?.focus();
    }
  }, [id]);

  useLayoutEffect(() => {
    if (!selection.current || !area.current) return;
    area.current.focus();
    area.current.setSelectionRange(selection.current.start, selection.current.end);
    selection.current = null;
  });

  /** The new list, kept a moment after the last change. */
  function change(next: Doc[]): void {
    setDocs(next);
    clearTimeout(timer.current);
    setSaveState('Saving…');
    timer.current = setTimeout(() => {
      setSaveState(saveDocs(next) ? 'Saved' : 'Not saved: this browser is not keeping data');
    }, 500);
  }

  function write(body: string): void {
    if (id) change(updateBody(docs, id, body, Date.now()));
  }

  function format(kind: Format): void {
    const field = area.current;
    if (!field) return;
    const edit = applyFormat(field.value, field.selectionStart, field.selectionEnd, kind);
    selection.current = { start: edit.start, end: edit.end };
    write(edit.text);
  }

  function startDoc(): void {
    const made = createDoc(docs, doc?.folder ?? DEFAULT_FOLDER, Date.now());
    change(made.list);
    focusNext.current = true;
    location.hash = `#/doc/${made.id}`;
  }

  const tree = treeOf(docs);
  const versions = [...(doc?.versions ?? [])].reverse();
  const words = wordCount(doc?.body ?? '');

  return (
    <kt-app-shell ref={shell} className="app" label={APP.name}>
      <div slot="header" className="app-header">
        <h1 className="doc-title">{doc?.title ?? ''}</h1>
        <span className="save-state" role="status">
          {saveState}
        </span>
        {doc ? (
          <div className="header-actions">
            <kt-button
              variant="secondary"
              size="small"
              icon="history"
              onClick={() => setHistoryOpen(true)}
            >
              History
            </kt-button>
            <kt-button
              variant="secondary-no-bg"
              size="small"
              icon="trash-2"
              label="Delete document"
              onClick={() =>
                ask({
                  heading: `Delete “${doc.title}”?`,
                  message: 'It goes for good, with its history.',
                  confirmLabel: 'Delete',
                  variant: 'danger',
                  then: () => {
                    change(deleteDoc(docs, doc.id));
                    location.hash = '#/';
                  },
                })
              }
            />
          </div>
        ) : null}
      </div>

      <div slot="sidebar" className="side">
        <kt-button variant="secondary" icon="square-pen" onClick={startDoc}>
          New document
        </kt-button>
        <kt-tree
          className="documents"
          label="Documents"
          items={tree}
          expanded={tree.map((folder) => folder.id)}
          selected={id ?? ''}
          onkt-select={(event) => {
            if (!event.detail.id.startsWith('folder:')) location.hash = `#/doc/${event.detail.id}`;
          }}
        />
      </div>

      {doc ? (
        <div className="editor">
          <div className="toolbar" role="toolbar" aria-label="Formatting">
            {TOOLS.map((tool) => (
              <kt-tooltip key={tool.format} text={tool.label}>
                <kt-button
                  variant="secondary-no-bg"
                  size="small"
                  icon={tool.icon}
                  label={tool.label}
                  onClick={() => format(tool.format)}
                />
              </kt-tooltip>
            ))}
            <span className="toolbar-gap" />
            <kt-segmented-control
              label="View"
              size="small"
              options={MODES}
              value={mode}
              onkt-change={(event) => setMode(String(event.detail.value))}
            />
          </div>
          <div className={`panes ${mode}`}>
            <textarea
              ref={area}
              className="page"
              aria-label="Document, in Markdown"
              spellCheck
              value={doc.body}
              onChange={(event) => write(event.target.value)}
              onKeyDown={(event) => {
                if (!(event.metaKey || event.ctrlKey)) return;
                const tool = TOOLS.find((t) => t.keys === `mod ${event.key.toLowerCase()}`);
                if (!tool) return;
                event.preventDefault();
                format(tool.format);
              }}
            />
            <Preview source={doc.body} />
          </div>
          <div className="status-bar">
            <span className="word-count">{`${words} ${words === 1 ? 'word' : 'words'}`}</span>
          </div>
        </div>
      ) : docs.length === 0 ? (
        <kt-empty-state
          icon="file-text"
          heading="No documents"
          description="Start one: it saves itself as you write."
        >
          <kt-button slot="actions" icon="square-pen" onClick={startDoc}>
            New document
          </kt-button>
        </kt-empty-state>
      ) : id !== null ? (
        <kt-error-page homeHref="#/" />
      ) : null}

      <kt-side-panel
        eyebrow="History"
        heading="Versions"
        open={historyOpen}
        onkt-close={() => setHistoryOpen(false)}
      >
        <p className="muted">A version is kept a minute at most, the last twenty.</p>
        <ul className="versions">
          {versions.length === 0 ? (
            <kt-empty-state
              compact
              icon="history"
              heading="No versions yet"
              description="Write for a while: the text you replace is kept here."
            />
          ) : (
            versions.map((version) => (
              <li key={version.at} className="version">
                <div className="version-copy">
                  <span className="version-when">{when.format(version.at)}</span>
                  <span className="version-text">
                    {version.body.trim() ? titleOf(version.body) : 'Empty'}
                  </span>
                </div>
                <kt-button
                  variant="secondary"
                  size="small"
                  icon="rotate-ccw"
                  onClick={() =>
                    ask({
                      heading: 'Restore this version?',
                      message:
                        'The text you have now is kept as a version too, so nothing is lost.',
                      confirmLabel: 'Restore',
                      variant: 'primary',
                      then: () => {
                        if (id) change(restoreVersion(docs, id, version.at, Date.now()));
                      },
                    })
                  }
                >
                  Restore
                </kt-button>
              </li>
            ))
          )}
        </ul>
      </kt-side-panel>

      <kt-confirm-dialog
        open={asking}
        heading={question?.heading ?? ''}
        message={question?.message ?? ''}
        confirmLabel={question?.confirmLabel ?? ''}
        variant={question?.variant ?? 'danger'}
        onkt-confirm={() => {
          setAsking(false);
          question?.then();
        }}
        onkt-cancel={() => setAsking(false)}
      />
    </kt-app-shell>
  );
}
