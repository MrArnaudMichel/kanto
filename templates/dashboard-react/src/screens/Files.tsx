/** A file browser: the plainest screen, and the one that shows the most components at once. */
import { useEffect, useState } from 'react';
import { toaster } from 'kanto-ds';
import { fileCell } from '../cells';
import { listFiles, type FileRow } from '../data/api';
import { FILE_STATS } from '../data/fixtures';
import { Screen, SectionHeader, TileCard, useKept } from '../parts';
import { visibleFiles, type FileFilter } from '../views';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'kind', label: 'Type', width: '110px' },
  { key: 'size', label: 'Size', width: '110px', align: 'right' as const },
  { key: 'opened', label: 'Opened', width: '120px' },
  { key: 'actions', label: '', width: '52px', align: 'right' as const },
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'starred', label: 'Starred' },
];

// Kept while the reader is elsewhere.
const kept = { filter: 'all' as FileFilter, query: '' };

const renderFile = fileCell((file) => toaster.info(`Downloading ${file.name}…`));

export function Files() {
  const [all, setAll] = useState<readonly FileRow[] | null>(null);
  const [filter, setFilter] = useKept(kept, 'filter');
  const [query, setQuery] = useKept(kept, 'query');

  useEffect(() => {
    let live = true;
    void listFiles().then((rows) => {
      if (live) setAll(rows);
    });
    return () => {
      live = false;
    };
  }, []);

  const rows = visibleFiles(all ?? [], filter, query);

  return (
    <Screen name="files">
      <kt-page-header
        eyebrow="Workspace"
        heading="Files"
        description="Everything the workspace has stored, newest first."
      >
        <kt-button
          slot="actions"
          variant="dark"
          icon="upload"
          onClick={() => toaster.info('Uploads go to your storage: see src/data/api.ts.')}
        >
          Upload
        </kt-button>
      </kt-page-header>

      <div className="tile-row">
        {FILE_STATS.map((tile) => (
          <TileCard key={tile.label} tile={tile} />
        ))}
      </div>

      <kt-card className="toolbar-card">
        <div className="toolbar">
          <kt-input
            icon="search"
            placeholder="Search files…"
            label="Search files"
            value={query}
            onkt-input={(event) => setQuery(event.detail.value)}
          />
          <kt-segmented-control
            label="Filter"
            options={FILTERS}
            value={filter}
            onkt-change={(event) => setFilter(event.detail.value as FileFilter)}
          />
          <span className="grow" />
          <span className="muted small">{`${rows.length} of ${all?.length ?? 0}`}</span>
        </div>
      </kt-card>

      <section className="stack">
        <SectionHeader heading="Recently opened" />
        <kt-card>
          {all !== null && rows.length === 0 ? (
            <kt-empty-state
              icon="search"
              heading="No files match"
              description="Try a shorter word, or clear the filter."
            >
              <kt-button
                slot="actions"
                variant="dark"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
              >
                Clear
              </kt-button>
            </kt-empty-state>
          ) : (
            <kt-table
              label="Files"
              compact
              loading={all === null}
              columns={COLUMNS}
              data={rows}
              renderCell={renderFile}
            />
          )}
        </kt-card>
      </section>
    </Screen>
  );
}
