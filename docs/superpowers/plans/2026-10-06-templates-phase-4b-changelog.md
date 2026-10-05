# Templates, phase 4b — Changelog × 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Changelog template — a product's public release notes: releases, a filter by kind, a page per release, a subscribe form and an RSS feed — in React, Vue and TypeScript, make it with `create-kanto`, and run it on its template page.

**Architecture:** As the other templates. The releases are data (`src/content.ts`); filtering, finding a release and its neighbours are plain functions (`src/releases.ts`); the feed is built from the same data (`src/rss.ts`) and committed as `public/rss.xml`, which a test holds equal to what `rss.ts` builds, so a static host serves it. Hash routes: `#/` all releases, `#/releases/<version>` one.

**Tech Stack:** as phase 4a; components: `kt-header`, `kt-timeline`, `kt-timeline-item`, `kt-badge`, `kt-toggle-button-group`, `kt-newsletter`, `kt-post-grid`, `kt-button`, `kt-footer`, `kt-error-page`.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md` (Changelog row).

## Global Constraints

- `templates/changelog-{react,vue,vanilla}`: as every template; Northwind's release notes.
- Shared and identical (`SHARED.changelog`): `src/content.ts`, `src/releases.ts`, `src/rss.ts`, `src/actions.ts`, `src/brand.ts`, `src/icons.ts`, `src/styles.css`, `public/rss.xml`.
- Vanilla puts every string in as text; the feed escapes everything it writes.
- Commits after `npm run verify`; Arnaud Michel's name, no trailer.

## Review Focus

1. **The filter never leaves an empty page silently** — a kind with no change in a release hides that release; none at all shows an empty state with the way back.
2. **A release page for every version, and not for others** — neighbours link both ways; an unknown version → `kt-error-page`.
3. **The feed is valid and safe** — XML escaped, dates RFC 822, one item per release, the file served equal to the data.
4. **Subscribing says what happened** — sent, or already on the list.
5. **A phone** — the header's menu; no sideways scroll.

---

### Task 1: shared core — failing tests in `scripts/templates.test.ts` (filter, neighbours, counts, the feed's escaping and dates, `public/rss.xml` equal to `buildRss`), then the files.

### Task 2: `changelog-vanilla` and `SMOKES.changelog` — all releases with their badges; filter Fixed: only fixes, then All; open a release, its neighbour, back; unknown version → error page; subscribe; `rss.xml` served and parses; 390px: no sideways scroll, the header's menu. Commit "feat(templates): add the changelog without a framework, on a shared core".

### Task 3: `changelog-react`; Task 4: `changelog-vue` — same walk.

### Task 5: Changelog in `create-kanto` (last) and on the site — catalog entry, screens, CHANGELOG; verify; check:templates (twenty-one `ok`).
