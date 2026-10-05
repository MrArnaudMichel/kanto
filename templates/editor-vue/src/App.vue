<script setup lang="ts">
import type { KtAppShell } from 'kanto-ds';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
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
import Preview from './Preview.vue';
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

const docs = shallowRef<Doc[]>(loadDocs());
const mode = ref('split');
const saveState = ref('Saved');
const historyOpen = ref(false);
// The question stays while its dialog closes, so its words do not vanish first.
const question = shallowRef<Question | null>(null);
const asking = ref(false);
const shell = useTemplateRef<KtAppShell>('shell');
const area = useTemplateRef<HTMLTextAreaElement>('area');

// === The document in the address: #/doc/<id> ===

const readId = () => {
  const id = /^#\/doc\/(.+)$/.exec(location.hash)?.[1];
  return id ? decodeURIComponent(id) : null;
};
const id = ref(readId());
const onHash = () => (id.value = readId());
onMounted(() => window.addEventListener('hashchange', onHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));

const doc = computed(() => docs.value.find((candidate) => candidate.id === id.value));
const tree = computed(() => treeOf(docs.value));
const expanded = computed(() => tree.value.map((folder) => folder.id));
const versions = computed(() => [...(doc.value?.versions ?? [])].reverse());
const words = computed(() => wordCount(doc.value?.body ?? ''));

// No document in the address: open the first.
watch(
  [id, docs],
  () => {
    const first = docs.value[0];
    if (id.value === null && first) location.replace(`#/doc/${first.id}`);
  },
  { immediate: true },
);

watch(doc, (current) => (document.title = current ? `${current.title} — ${APP.name}` : APP.name), {
  immediate: true,
});

// A document chosen: the drawer closes, and a new one takes the focus.
let focusNext = false;
watch(id, () => {
  if (shell.value) shell.value.sidebarOpen = false;
  if (focusNext) {
    focusNext = false;
    void nextTick(() => area.value?.focus());
  }
});

// === Saving, a moment after the typing stops ===

let timer: ReturnType<typeof setTimeout> | undefined;
function change(next: Doc[]): void {
  docs.value = next;
  clearTimeout(timer);
  saveState.value = 'Saving…';
  timer = setTimeout(() => {
    saveState.value = saveDocs(next) ? 'Saved' : 'Not saved: this browser is not keeping data';
  }, 500);
}

function write(body: string): void {
  if (id.value) change(updateBody(docs.value, id.value, body, Date.now()));
}

function format(kind: Format): void {
  const field = area.value;
  if (!field) return;
  const edit = applyFormat(field.value, field.selectionStart, field.selectionEnd, kind);
  write(edit.text);
  void nextTick(() => {
    field.focus();
    field.setSelectionRange(edit.start, edit.end);
  });
}

function onKey(event: KeyboardEvent): void {
  if (!(event.metaKey || event.ctrlKey)) return;
  const tool = TOOLS.find((candidate) => candidate.keys === `mod ${event.key.toLowerCase()}`);
  if (!tool) return;
  event.preventDefault();
  format(tool.format);
}

// === Documents ===

function startDoc(): void {
  const made = createDoc(docs.value, doc.value?.folder ?? DEFAULT_FOLDER, Date.now());
  change(made.list);
  focusNext = true;
  location.hash = `#/doc/${made.id}`;
}

function onTree(event: CustomEvent<{ id: string }>): void {
  if (!event.detail.id.startsWith('folder:')) location.hash = `#/doc/${event.detail.id}`;
}

function ask(next: Question): void {
  question.value = next;
  asking.value = true;
}

function askDelete(): void {
  const current = doc.value;
  if (!current) return;
  ask({
    heading: `Delete “${current.title}”?`,
    message: 'It goes for good, with its history.',
    confirmLabel: 'Delete',
    variant: 'danger',
    then: () => {
      change(deleteDoc(docs.value, current.id));
      location.hash = '#/';
    },
  });
}

function askRestore(at: number): void {
  ask({
    heading: 'Restore this version?',
    message: 'The text you have now is kept as a version too, so nothing is lost.',
    confirmLabel: 'Restore',
    variant: 'primary',
    then: () => {
      if (id.value) change(restoreVersion(docs.value, id.value, at, Date.now()));
    },
  });
}

function confirmed(): void {
  asking.value = false;
  question.value?.then();
}
</script>

<template>
  <kt-app-shell ref="shell" class="app" :label="APP.name">
    <div slot="header" class="app-header">
      <h1 class="doc-title">{{ doc?.title ?? '' }}</h1>
      <span class="save-state" role="status">{{ saveState }}</span>
      <div v-if="doc" class="header-actions">
        <kt-button variant="secondary" size="small" icon="history" @click="historyOpen = true">
          History
        </kt-button>
        <kt-button
          variant="secondary-no-bg"
          size="small"
          icon="trash-2"
          label="Delete document"
          @click="askDelete"
        />
      </div>
    </div>

    <div slot="sidebar" class="side">
      <kt-button variant="secondary" icon="square-pen" @click="startDoc">New document</kt-button>
      <kt-tree
        class="documents"
        label="Documents"
        :items="tree"
        :expanded="expanded"
        :selected="id ?? ''"
        @kt-select="onTree"
      />
    </div>

    <div v-if="doc" class="editor">
      <div class="toolbar" role="toolbar" aria-label="Formatting">
        <kt-tooltip v-for="tool in TOOLS" :key="tool.format" :text="tool.label">
          <kt-button
            variant="secondary-no-bg"
            size="small"
            :icon="tool.icon"
            :label="tool.label"
            @click="format(tool.format)"
          />
        </kt-tooltip>
        <span class="toolbar-gap" />
        <kt-segmented-control
          label="View"
          size="small"
          :options="MODES"
          :value="mode"
          @kt-change="(event: CustomEvent<{ value: string }>) => (mode = event.detail.value)"
        />
      </div>
      <div :class="['panes', mode]">
        <textarea
          ref="area"
          class="page"
          aria-label="Document, in Markdown"
          spellcheck="true"
          :value="doc.body"
          @input="write(($event.target as HTMLTextAreaElement).value)"
          @keydown="onKey"
        />
        <Preview :source="doc.body" />
      </div>
      <div class="status-bar">
        <span class="word-count">{{ `${words} ${words === 1 ? 'word' : 'words'}` }}</span>
      </div>
    </div>
    <kt-empty-state
      v-else-if="docs.length === 0"
      icon="file-text"
      heading="No documents"
      description="Start one: it saves itself as you write."
    >
      <kt-button slot="actions" icon="square-pen" @click="startDoc">New document</kt-button>
    </kt-empty-state>
    <kt-error-page v-else-if="id !== null" home-href="#/" />

    <kt-side-panel
      eyebrow="History"
      heading="Versions"
      :open="historyOpen"
      @kt-close="historyOpen = false"
    >
      <p class="muted">A version is kept a minute at most, the last twenty.</p>
      <ul class="versions">
        <kt-empty-state
          v-if="versions.length === 0"
          compact
          icon="history"
          heading="No versions yet"
          description="Write for a while: the text you replace is kept here."
        />
        <li v-for="version in versions" v-else :key="version.at" class="version">
          <div class="version-copy">
            <span class="version-when">{{ when.format(version.at) }}</span>
            <span class="version-text">
              {{ version.body.trim() ? titleOf(version.body) : 'Empty' }}
            </span>
          </div>
          <kt-button
            variant="secondary"
            size="small"
            icon="rotate-ccw"
            @click="askRestore(version.at)"
          >
            Restore
          </kt-button>
        </li>
      </ul>
    </kt-side-panel>

    <kt-confirm-dialog
      :open="asking"
      :heading="question?.heading ?? ''"
      :message="question?.message ?? ''"
      :confirm-label="question?.confirmLabel ?? ''"
      :variant="question?.variant ?? 'danger'"
      @kt-confirm="confirmed"
      @kt-cancel="asking = false"
    />
  </kt-app-shell>
</template>
