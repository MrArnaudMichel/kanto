<script setup lang="ts">
/** A file browser: the plainest screen, and the one that shows the most components at once. */
import { toaster } from 'kanto-ds';
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { fileCell } from '../cells';
import { listFiles, type FileRow } from '../data/api';
import { FILE_STATS } from '../data/fixtures';
import SectionHeader from '../SectionHeader.vue';
import TileCard from '../TileCard.vue';
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
const renderFile = fileCell((file) => toaster.info(`Downloading ${file.name}…`));

const all = shallowRef<readonly FileRow[] | null>(null);
const filter = ref<FileFilter>('all');
const query = ref('');
let live = true;
onBeforeUnmount(() => {
  live = false;
});
void listFiles().then((rows) => {
  if (live) all.value = rows;
});

const rows = computed(() => visibleFiles(all.value ?? [], filter.value, query.value));
</script>

<template>
  <div class="screen screen-files">
    <kt-page-header
      eyebrow="Workspace"
      heading="Files"
      description="Everything the workspace has stored, newest first."
    >
      <kt-button
        slot="actions"
        variant="dark"
        icon="upload"
        @click="toaster.info('Uploads go to your storage: see src/data/api.ts.')"
      >
        Upload
      </kt-button>
    </kt-page-header>

    <div class="tile-row">
      <TileCard v-for="tile in FILE_STATS" :key="tile.label" :tile="tile" />
    </div>

    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-input
          icon="search"
          placeholder="Search files…"
          label="Search files"
          :value="query"
          @kt-input="(event: CustomEvent<{ value: string }>) => (query = event.detail.value)"
        />
        <kt-segmented-control
          label="Filter"
          :options="FILTERS"
          :value="filter"
          @kt-change="(event: CustomEvent<{ value: FileFilter }>) => (filter = event.detail.value)"
        />
        <span class="grow" />
        <span class="muted small">{{ `${rows.length} of ${all?.length ?? 0}` }}</span>
      </div>
    </kt-card>

    <section class="stack">
      <SectionHeader heading="Recently opened" />
      <kt-card>
        <kt-empty-state
          v-if="all !== null && rows.length === 0"
          icon="search"
          heading="No files match"
          description="Try a shorter word, or clear the filter."
        >
          <kt-button slot="actions" variant="dark" @click="((query = ''), (filter = 'all'))">
            Clear
          </kt-button>
        </kt-empty-state>
        <kt-table
          v-else
          label="Files"
          compact
          :loading="all === null"
          :columns="COLUMNS"
          :data="rows"
          :render-cell="renderFile"
        />
      </kt-card>
    </section>
  </div>
</template>
