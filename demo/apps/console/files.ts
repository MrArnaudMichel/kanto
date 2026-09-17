import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';
import { rerender } from '../../lib/render.js';
import { consoleShell } from '../shell.js';

/** A file browser: the plainest possible screen, and the one that shows most. */

interface FileRow extends Record<string, unknown> {
  readonly name: string;
  readonly kind: 'PDF' | 'Sheet' | 'Image' | 'Archive' | 'Doc';
  readonly size: string;
  readonly opened: string;
  readonly starred: boolean;
}

const KIND_ICON: Record<FileRow['kind'], string> = {
  PDF: 'file-text',
  Sheet: 'table',
  Image: 'image',
  Archive: 'file-archive',
  Doc: 'file',
};

const KIND_TONE: Record<FileRow['kind'], string> = {
  PDF: 'var(--color-danger-base)',
  Sheet: 'var(--color-success-base)',
  Image: 'var(--chart-series-5)',
  Archive: 'var(--color-warning-base)',
  Doc: 'var(--chart-series-1)',
};

const FILES: readonly FileRow[] = [
  { name: 'Q3 revenue review.pdf', kind: 'PDF', size: '598 KB', opened: '1 d ago', starred: true },
  { name: 'Renewals — Sep.xlsx', kind: 'Sheet', size: '1.2 MB', opened: '1 d ago', starred: true },
  { name: 'Onboarding deck.pdf', kind: 'PDF', size: '5.2 MB', opened: '2 d ago', starred: false },
  { name: 'brand-marks.zip', kind: 'Archive', size: '18.4 MB', opened: '3 d ago', starred: false },
  { name: 'warehouse-eu.png', kind: 'Image', size: '842 KB', opened: '4 d ago', starred: false },
  { name: 'Incident 2026-08-31.md', kind: 'Doc', size: '16 KB', opened: '1 w ago', starred: false },
  { name: 'Audit export.xlsx', kind: 'Sheet', size: '4.3 MB', opened: '2 w ago', starred: false },
];

const state = { filter: 'all' as 'all' | 'starred', query: '' };

export function consoleFiles(): TemplateResult {
  const rows = FILES.filter((file) => {
    if (state.filter === 'starred' && !file.starred) return false;
    return file.name.toLowerCase().includes(state.query.trim().toLowerCase());
  });

  const used = 25.8;

  const body = html`
    <kt-page-header
      eyebrow="Workspace"
      heading="Files"
      description="Everything the workspace has stored, newest first."
    >
      <kt-button slot="actions" variant="dark" icon="upload">Upload</kt-button>
      <kt-button slot="actions" icon="plus">New folder</kt-button>
    </kt-page-header>

    <div class="tile-row">
      <kt-card class="tile">
        <span class="tile-icon blue"><kt-icon name="hard-drive" size="18"></kt-icon></span>
        <kt-stat label="Storage used" value=${`${used} GB`}></kt-stat>
      </kt-card>
      <kt-card class="tile">
        <span class="tile-icon violet"><kt-icon name="files" size="18"></kt-icon></span>
        <kt-stat label="Files and folders" value="1,286" delta="+36" trend="up"></kt-stat>
      </kt-card>
      <kt-card class="tile">
        <span class="tile-icon green"><kt-icon name="share-2" size="18"></kt-icon></span>
        <kt-stat label="Shared with others" value="24"></kt-stat>
      </kt-card>
      <kt-card class="tile">
        <span class="tile-icon amber"><kt-icon name="trash-2" size="18"></kt-icon></span>
        <kt-stat label="In the bin" value="3.1 GB"></kt-stat>
      </kt-card>
    </div>

    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-input
          icon="search"
          placeholder="Search files..."
          style="width:280px"
          .value=${state.query}
          @kt-input=${(e: CustomEvent<{ value: string }>) => {
            state.query = e.detail.value;
            rerender();
          }}
        ></kt-input>
        <kt-segmented-control
          label="Filter"
          .value=${state.filter}
          .options=${[
            { value: 'all', label: 'All' },
            { value: 'starred', label: 'Starred' },
          ]}
          @kt-change=${(e: CustomEvent<{ value: 'all' | 'starred' }>) => {
            state.filter = e.detail.value;
            rerender();
          }}
        ></kt-segmented-control>
        <span style="flex:1"></span>
        <span class="muted" style="font:var(--font-normal-small)"
          >${rows.length} of ${FILES.length}</span
        >
      </div>
    </kt-card>

    <section>
      <kt-page-header level="section" heading="Recently opened"></kt-page-header>
      <kt-card style="margin-top:12px">
        ${
          rows.length === 0
            ? html`<kt-empty-state
                icon="search"
                heading="No files match"
                description="Try a shorter word, or clear the filter."
              >
                <kt-button
                  slot="actions"
                  variant="dark"
                  @click=${() => {
                    state.query = '';
                    state.filter = 'all';
                    rerender();
                  }}
                  >Clear</kt-button
                >
              </kt-empty-state>`
            : html`<kt-table
                label="Files"
                compact
                .columns=${[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'kind', label: 'Type', width: '110px' },
                  { key: 'size', label: 'Size', width: '110px', align: 'right' },
                  { key: 'opened', label: 'Opened', width: '120px' },
                  { key: 'actions', label: '', width: '52px', align: 'right' },
                ]}
                .data=${rows}
                .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
                  const file = row as unknown as FileRow;
                  if (column.key === 'name') {
                    return html`<span class="cell-file">
                      <kt-icon
                        name=${KIND_ICON[file.kind]}
                        size="16"
                        style=${`color:${KIND_TONE[file.kind]}`}
                      ></kt-icon>
                      <span>${file.name}</span>
                      ${
                        file.starred
                          ? html`<kt-icon
                              name="star"
                              size="13"
                              style="color:var(--color-warning-base)"
                            ></kt-icon>`
                          : ''
                      }
                    </span>`;
                  }
                  if (column.key === 'actions') {
                    return html`<kt-button
                      variant="secondary-no-bg"
                      size="small"
                      icon="ellipsis"
                      label=${`Actions for ${file.name}`}
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        toaster.info(`Nothing behind this menu — ${file.name} is sample data.`);
                      }}
                    ></kt-button>`;
                  }
                  return undefined;
                }}
              ></kt-table>`
        }
      </kt-card>
    </section>
  `;

  return consoleShell('files', body);
}
