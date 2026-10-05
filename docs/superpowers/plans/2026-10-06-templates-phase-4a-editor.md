# Templates, phase 4a — Editor × 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Editor template — a document editor: documents on the side, a page with a toolbar, autosave, version history — in React, Vue and TypeScript, make it with `create-kanto`, and run it on its template page.

**Architecture:** As the other templates: `templates/editor-<stack>/`, what does not depend on the stack shared and tested once. **The writing surface is Markdown** in a page-like `<textarea>` styled from Kanto's tokens, beside a preview: the text stays plain text (safe to store, portable, diffable), the toolbar wraps the selection in Markdown, and a small shared renderer turns it into DOM nodes — text as text, links only to http(s), mailto and in-page anchors. `kt-textarea` is a form field (label, error, no selection API), so the page is a native textarea, styled as a page.

**Tech Stack:** as phase 3d; components: `kt-app-shell`, `kt-tree`, `kt-button`, `kt-tooltip`, `kt-kbd`, `kt-segmented-control`, `kt-side-panel`, `kt-confirm-dialog`, `kt-badge`, `kt-empty-state`, `kt-toast`.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md` (Editor row: "documents on the side, a page with a toolbar, autosave, version history").

## Global Constraints

- `templates/editor-{react,vue,vanilla}`: standalone Vite + TS, `kanto-ds@^1.9.0`, scripts `dev`/`build`/`preview`/`typecheck`, README, `.gitignore`, no lockfile.
- Routes: `#/` opens the first document, `#/doc/<id>` a document; an unknown id → `kt-error-page`.
- Shared and identical (`SHARED.editor`): `src/content.ts`, `src/documents.ts`, `src/markdown.ts`, `src/formatting.ts`, `src/store.ts`, `src/brand.ts`, `src/icons.ts`, `src/styles.css`.
- Documents persist in `localStorage` (`kanto-editor`), every access in try/catch; a fork replaces `src/store.ts`.
- Vanilla puts every string in as text; the preview is DOM built by `markdown.ts`, never `innerHTML`.
- Destructive actions ask first: deleting a document, restoring an older version.
- The walk selects by role, name, class and order; cells and previews are checked where they render.
- Commits after `npm run verify`; Arnaud Michel's name, no trailer; branch `feat/templates`.

## Review Focus

1. **Autosave survives a reload** — type, wait for "Saved", reload: the text is there. (Walk.)
2. **The toolbar wraps the selection** and keeps it selected; with nothing selected it inserts a placeholder, selected. (Unit tests on `formatting.ts`; walk presses Bold.)
3. **The preview is safe** — `<script>`, `javascript:` links and raw HTML render as text or not at all. (Unit tests.)
4. **History restores, and asks first.** (Walk.)
5. **A phone** — the documents are a drawer; no sideways scroll. (Walk at 390px.)

---

### Task 1: The shared core

**Interfaces — Produces:**

- `documents.ts`: `type Doc = { id, title, folder, body, updated, versions: Version[] }`, `Version = { at, body }`; `createDoc(list, folder, now) → { list, id }`, `updateBody(list, id, body, now) → list` (records a version when the last one is older than `VERSION_EVERY` = 60 s, keeps the last 20), `restoreVersion(list, id, at, now) → list`, `deleteDoc(list, id) → list`, `titleOf(body)` (the first heading or line, else "Untitled"), `treeOf(list) → KtTreeItem[]` (folders, then documents), `wordCount(body)`.
- `markdown.ts`: `renderMarkdown(source) → Node[]`: headings `#`–`###`, paragraphs, `-`/`*` and `1.` lists, `>` quotes, fenced code, `**bold**`, `*italic*`, `` `code` ``, `[text](url)`.
- `formatting.ts`: `applyFormat(text, start, end, kind) → { text, start, end }` for `bold | italic | code | heading | list | quote | link`.
- `store.ts`: `loadDocs() → Doc[]` (seed from `content.ts` when empty or unreadable), `saveDocs(list)`.

- [ ] Step 1: failing tests in `scripts/templates.test.ts` (`SHARED.editor`; versions every minute and capped; restore; titles; tree; the renderer's blocks, inlines and safety; each format with and without a selection; the store's fallback when storage throws).
- [ ] Step 2: the files; tests pass. Commits with Task 2.

### Task 2: `editor-vanilla`, and its walk

- [ ] Step 1: `SMOKES.editor` — opens on the first document, preview shows its heading; switch documents; type, see "Saved", reload, text kept; select a word, Bold, the source has `**word**`; History lists a version, Restore asks first; New document then Delete asks first and removes it; an unknown `#/doc/x` → `kt-error-page`; 390px: no sideways scroll, documents in the drawer. Run → FAIL.
- [ ] Step 2: project files, README; `main.ts` with the shell, tree, toolbar, page, preview, history panel, dialogs; walk passes; screenshots looked at.
- [ ] Step 3: verify, commit "feat(templates): add the editor without a framework, on a shared core".

### Task 3: `editor-react` — same structure, markers and walk; commit "feat(templates): add the editor in React".

### Task 4: `editor-vue` — same; commit "feat(templates): add the editor in Vue".

### Task 5: Editor in `create-kanto` (after `dashboard`) and on the site

- [ ] Catalog entry (`project: true`, `demo: './templates/editor/'`, screens shot from the build), choices, README and description of `create-kanto`, CHANGELOG; tests first (catalog order, demo path); verify; check:templates; commit "feat(templates): Editor in create-kanto and on the site".

## Done when

`npm run check:templates` prints eighteen `ok`; `npm run verify` passes; `#/templates/editor` runs the template.
