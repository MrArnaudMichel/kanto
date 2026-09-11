/**
 * Reads the release at the top of `CHANGELOG.md`.
 *
 * The changelog is the single source for what a release says. The notes on the
 * GitHub release are extracted from here rather than written a second time,
 * because two copies of the same text are two chances to disagree — and the
 * one nobody reads while writing is always the one that goes stale.
 *
 * Every failure is an exception with the reason in it. This runs from a script
 * that is about to tag and publish; refusing loudly is the whole point.
 */

/** `## [1.0.0] — 2026-09-09`, with the date optional so `[Unreleased]` matches. */
const HEADING = /^## \[([^\]]+)\](?:\s*[—–-]\s*(\S+))?\s*$/;

/** Keep a Changelog says nothing about the version; semver does. */
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * @typedef {object} Release
 * @property {string} version Semver, without the `v`.
 * @property {string} date The date as written, never as computed.
 * @property {string} notes The markdown under the heading, trimmed.
 */

/**
 * @param {string} markdown The contents of `CHANGELOG.md`.
 * @returns {Release}
 */
export function parseRelease(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => HEADING.test(line));
  if (start === -1) {
    throw new Error('CHANGELOG.md has no version section. Expected a `## [x.y.z] — date` heading.');
  }

  const [, label, date = ''] = /** @type {RegExpExecArray} */ (HEADING.exec(lines[start]));

  if (/^unreleased$/i.test(label)) {
    throw new Error(
      'The top section of CHANGELOG.md is [Unreleased]. Give it a version and a date first.',
    );
  }
  if (!SEMVER.test(label)) {
    throw new Error(`CHANGELOG.md has no version section: "${label}" is not a semver version.`);
  }

  // The next version heading, or the end of the file for the first release.
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => HEADING.test(line));
  const notes = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();

  if (notes === '') {
    throw new Error(`Version ${label} in CHANGELOG.md has no notes under it.`);
  }

  return { version: label, date, notes };
}
