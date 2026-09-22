import { describe, expect, it } from 'vitest';
import { mergeReleases, parseChangelog, summarize } from './releases.js';
import type { Release } from './github.js';

const CHANGELOG = `# Changelog

All notable changes to this project are documented here.

## [1.1.0] — 2026-10-02

### Added

- \`kt-meter\`, a divided bar.

## [1.0.0] — 2026-09-12

First release of Kanto, a design system for data-dense product interfaces.

### Added

**Token layer** — colours and type.
`;

const github = (tag: string, overrides: Partial<Release> = {}): Release => ({
  tag,
  name: tag,
  url: `https://github.com/o/r/releases/tag/${tag}`,
  publishedAt: '2026-09-12T10:00:00Z',
  body: '',
  prerelease: false,
  ...overrides,
});

describe('parseChangelog', () => {
  it('splits the file into one entry per version, newest first as written', () => {
    const entries = parseChangelog(CHANGELOG);

    expect(entries.map((entry) => entry.version)).toEqual(['1.1.0', '1.0.0']);
    expect(entries.map((entry) => entry.date)).toEqual(['2026-10-02', '2026-09-12']);
  });

  it('keeps each version to its own notes', () => {
    const [newer, older] = parseChangelog(CHANGELOG);

    expect(newer!.notes).toContain('kt-meter');
    expect(newer!.notes).not.toContain('Token layer');
    expect(older!.notes).toContain('Token layer');
    expect(older!.notes.startsWith('First release')).toBe(true);
  });

  it('skips a section that is not a version', () => {
    const entries = parseChangelog('## [Unreleased]\n\n- wip\n\n## [0.1.0] — 2026-01-01\n\n- a');

    expect(entries.map((entry) => entry.version)).toEqual(['0.1.0']);
  });

  it('returns nothing for a file with no version sections', () => {
    expect(parseChangelog('# Changelog\n\nNothing yet.')).toEqual([]);
  });
});

describe('summarize', () => {
  it('takes the first thing the notes say, whether a paragraph or a bullet', () => {
    expect(summarize('First release of Kanto.\n\n### Added\n\n- x')).toBe(
      'First release of Kanto.',
    );
    expect(summarize('### Added\n\n- `kt-meter`, a divided bar.\n- more')).toBe(
      'kt-meter, a divided bar.',
    );
  });

  it('reads as plain text, without markdown punctuation', () => {
    expect(summarize('**Token layer** — [colours](x) and `type`.')).toBe(
      'Token layer — colours and type.',
    );
  });

  it('joins a paragraph wrapped across lines', () => {
    expect(summarize('One implementation,\nbuilt on custom elements.')).toBe(
      'One implementation, built on custom elements.',
    );
  });

  it('is empty when there is nothing but headings', () => {
    expect(summarize('### Added\n\n')).toBe('');
  });
});

describe('mergeReleases', () => {
  const changelog = parseChangelog(CHANGELOG);

  it('uses the changelog alone while GitHub has not answered', () => {
    const entries = mergeReleases(changelog, null);

    expect(entries.map((entry) => entry.tag)).toEqual(['v1.1.0', 'v1.0.0']);
    expect(entries.every((entry) => entry.status === 'unknown')).toBe(true);
    expect(entries[0]!.date).toBe('2 October 2026');
  });

  it('prefers what GitHub published: its date, its link and its notes', () => {
    const [, older] = mergeReleases(changelog, [
      github('v1.0.0', { publishedAt: '2026-09-13T08:00:00Z', body: 'From GitHub.' }),
    ]);

    expect(older!.date).toBe('13 September 2026');
    expect(older!.notes).toBe('From GitHub.');
    expect(older!.url).toContain('github.com/o/r');
    expect(older!.status).toBe('published');
  });

  it('keeps the changelog notes when the tag on GitHub has none', () => {
    const [, older] = mergeReleases(changelog, [github('v1.0.0', { body: '  ' })]);

    expect(older!.notes).toContain('Token layer');
  });

  it('marks a version the changelog has but GitHub does not as not tagged yet', () => {
    const [newer] = mergeReleases(changelog, [github('v1.0.0')]);

    expect(newer!.tag).toBe('v1.1.0');
    expect(newer!.status).toBe('untagged');
  });

  it('keeps a tag GitHub has that the changelog never mentioned', () => {
    const entries = mergeReleases(changelog, [github('v0.9.0', { body: 'Early.' })]);

    expect(entries.map((entry) => entry.tag)).toEqual(['v1.1.0', 'v1.0.0', 'v0.9.0']);
  });

  it('orders by version, not by where each one came from', () => {
    const entries = mergeReleases(parseChangelog('## [1.0.0] — 2026-09-12\n\n- a'), [
      github('v1.10.0'),
      github('v1.2.0'),
    ]);

    expect(entries.map((entry) => entry.tag)).toEqual(['v1.10.0', 'v1.2.0', 'v1.0.0']);
  });

  it('carries a pre-release flag through', () => {
    const [entry] = mergeReleases([], [github('v2.0.0-beta.1', { prerelease: true })]);

    expect(entry!.prerelease).toBe(true);
  });
});
