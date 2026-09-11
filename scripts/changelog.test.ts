// @vitest-environment node
// Nothing here touches the DOM, and a script's test has no business booting one.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseRelease } from './changelog.js';

/** A changelog with two versions, shaped like the real one. */
const TWO_VERSIONS = `# Changelog

All notable changes to this project are documented here.

## [1.1.0] — 2026-09-12

### Added

- \`kt-splitter\`, a two-pane resizer.

## [1.0.0] — 2026-09-09

First release.
`;

describe('parseRelease', () => {
  it('reads the version, the date and the notes of the topmost section', () => {
    expect(parseRelease(TWO_VERSIONS)).toEqual({
      version: '1.1.0',
      date: '2026-09-12',
      notes: '### Added\n\n- `kt-splitter`, a two-pane resizer.',
    });
  });

  it('stops the notes at the next version, not at the end of the file', () => {
    expect(parseRelease(TWO_VERSIONS).notes).not.toContain('First release');
  });

  it('runs the notes to the end of the file for a single version', () => {
    const one = '# Changelog\n\n## [1.0.0] — 2026-09-09\n\nFirst release.\n';
    expect(parseRelease(one).notes).toBe('First release.');
  });

  it('accepts the hyphen Keep a Changelog uses as well as an em dash', () => {
    const hyphen = '# Changelog\n\n## [1.0.0] - 2026-09-09\n\nFirst release.\n';
    expect(parseRelease(hyphen)).toMatchObject({ version: '1.0.0', date: '2026-09-09' });
  });

  it('refuses an Unreleased section, which is not a thing to publish', () => {
    const unreleased = `# Changelog\n\n## [Unreleased]\n\n- work in progress\n\n${TWO_VERSIONS}`;
    expect(() => parseRelease(unreleased)).toThrow(/Unreleased/);
  });

  it('refuses a changelog with no version section', () => {
    expect(() => parseRelease('# Changelog\n\nNothing yet.\n')).toThrow(/no version/i);
  });

  it('refuses a version whose notes are empty, so no release ships blank', () => {
    const blank = '# Changelog\n\n## [1.1.0] — 2026-09-12\n\n## [1.0.0] — 2026-09-09\n\nFirst.\n';
    expect(() => parseRelease(blank)).toThrow(/1\.1\.0/);
  });

  it('refuses a version that is not semver', () => {
    expect(() => parseRelease('## [1.1] — 2026-09-12\n\nNotes.\n')).toThrow(/no version/i);
  });

  it("parses this repository's own changelog", () => {
    const real = readFileSync(fileURLToPath(new URL('../CHANGELOG.md', import.meta.url)), 'utf8');
    const release = parseRelease(real);

    expect(release.version).toBe('1.0.0');
    expect(release.date).toBe('2026-09-09');
    expect(release.notes).toMatch(/^First release of Kanto/);
    expect(release.notes).toMatch(/commercial/);
  });
});
