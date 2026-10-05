/** A file browser: the plainest screen, and the one that shows the most components at once. */
import { toaster, type KtInput, type KtSegmentedControl, type KtTable } from 'kanto-ds';
import { fileCell } from '../cells';
import { listFiles, type FileRow } from '../data/api';
import { FILE_STATS } from '../data/fixtures';
import { button, el, pageHeader, screen, sectionHeader, tile } from '../dom';
import { visibleFiles, type FileFilter } from '../views';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'kind', label: 'Type', width: '110px' },
  { key: 'size', label: 'Size', width: '110px', align: 'right' as const },
  { key: 'opened', label: 'Opened', width: '120px' },
  { key: 'actions', label: '', width: '52px', align: 'right' as const },
];

let filter: FileFilter = 'all';
let query = '';

export function files(outlet: HTMLElement): () => void {
  let live = true;
  let all: readonly FileRow[] = [];

  const search = el<KtInput>('kt-input', {
    icon: 'search',
    placeholder: 'Search files…',
    label: 'Search files',
  });
  search.value = query;
  search.addEventListener('kt-input', (event) => {
    query = (event as CustomEvent<{ value: string }>).detail.value;
    draw();
  });

  const segments = el<KtSegmentedControl>('kt-segmented-control', { label: 'Filter' });
  segments.options = [
    { value: 'all', label: 'All' },
    { value: 'starred', label: 'Starred' },
  ];
  segments.value = filter;
  segments.addEventListener('kt-change', (event) => {
    filter = (event as CustomEvent<{ value: FileFilter }>).detail.value;
    draw();
  });

  const shownCount = el('span', { class: 'muted small' });
  const body = el('kt-card');
  const table = el<KtTable>('kt-table', { label: 'Files', compact: true });
  table.columns = COLUMNS;
  table.renderCell = fileCell((file) => toaster.info(`Downloading ${file.name}…`));
  table.loading = true;

  function draw(): void {
    const rows = visibleFiles(all, filter, query);
    shownCount.textContent = `${rows.length} of ${all.length}`;
    if (rows.length > 0 || table.loading) {
      table.data = rows;
      body.replaceChildren(table);
      return;
    }
    body.replaceChildren(
      el(
        'kt-empty-state',
        {
          icon: 'search',
          heading: 'No files match',
          description: 'Try a shorter word, or clear the filter.',
        },
        [
          button('Clear', { slot: 'actions', variant: 'dark' }, () => {
            query = '';
            filter = 'all';
            search.value = '';
            segments.value = 'all';
            draw();
          }),
        ],
      ),
    );
  }

  outlet.append(
    screen('files', [
      pageHeader('Workspace', 'Files', 'Everything the workspace has stored, newest first.', [
        button('Upload', { variant: 'dark', icon: 'upload' }, () =>
          toaster.info('Uploads go to your storage: see src/data/api.ts.'),
        ),
      ]),
      el(
        'div',
        { class: 'tile-row' },
        FILE_STATS.map((figure) => tile(figure)),
      ),
      el('kt-card', { class: 'toolbar-card' }, [
        el('div', { class: 'toolbar' }, [
          search,
          segments,
          el('span', { class: 'grow' }),
          shownCount,
        ]),
      ]),
      el('section', { class: 'stack' }, [sectionHeader('Recently opened'), body]),
    ]),
  );
  draw();
  void listFiles().then((rows) => {
    if (!live) return;
    all = rows;
    table.loading = false;
    draw();
  });
  return () => {
    live = false;
  };
}
